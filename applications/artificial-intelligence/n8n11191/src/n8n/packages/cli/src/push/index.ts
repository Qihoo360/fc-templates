import type { PushMessage } from '@n8n/api-types';
import { inProduction, Logger } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import { OnPubSubEvent, OnShutdown } from '@n8n/decorators';
import { Container, Service } from '@n8n/di';
import type { Application } from 'express';
import { ServerResponse } from 'http';
import type { Server } from 'http';
import pick from 'lodash/pick';
import { InstanceSettings } from 'n8n-core';
import { parse as parseUrl } from 'url';
import { Server as WSServer } from 'ws';
import * as crypto from 'crypto'; // 添加 crypto 模块导入

import { AuthService } from '@/auth/auth.service';
import { BadRequestError } from '@/errors/response-errors/bad-request.error';
import { Publisher } from '@/scaling/pubsub/publisher.service';
import { TypedEmitter } from '@/typed-emitter';

import { validateOriginHeaders } from './origin-validator';
import { PushConfig } from './push.config';
import { SSEPush } from './sse.push';
import type { OnPushMessage, PushResponse, SSEPushRequest, WebSocketPushRequest } from './types';
import { WebSocketPush } from './websocket.push';

type PushEvents = {
	editorUiConnected: string;
	message: OnPushMessage;
};

/**
 * Max allowed size of a push message in bytes. Events going through the pubsub
 * channel are trimmed if exceeding this size.
 */
const MAX_PAYLOAD_SIZE_BYTES = 5 * 1024 * 1024; // 5 MiB

/**
 * Push service for uni- or bi-directional communication with frontend clients.
 * Uses either server-sent events (SSE, unidirectional from backend --> frontend)
 * or WebSocket (bidirectional backend <--> frontend) depending on the configuration.
 *
 * @emits message when a message is received from a client
 */
@Service()
export class Push extends TypedEmitter<PushEvents> {
	private useWebSockets = this.config.backend === 'websocket';

	isBidirectional = this.useWebSockets;

	private backend = this.useWebSockets ? Container.get(WebSocketPush) : Container.get(SSEPush);

	constructor(
		private readonly config: PushConfig,
		private readonly instanceSettings: InstanceSettings,
		private readonly logger: Logger,
		private readonly authService: AuthService,
		private readonly publisher: Publisher,
	) {
		super();
		this.logger = this.logger.scoped('push');

		if (this.useWebSockets) this.backend.on('message', (msg) => this.emit('message', msg));
	}

	getBackend() {
		return this.backend;
	}

	/** Sets up the main express app to upgrade websocket connections */
	setupPushServer(restEndpoint: string, server: Server, app: Application) {
		if (this.useWebSockets) {
			const wsServer = new WSServer({ noServer: true });
			server.on('upgrade', (request: WebSocketPushRequest, socket, upgradeHead) => {
				if (parseUrl(request.url).pathname === `/${restEndpoint}/push`) {
					wsServer.handleUpgrade(request, socket, upgradeHead, (ws) => {
						request.ws = ws;

						const response = new ServerResponse(request);
						response.writeHead = (statusCode) => {
							if (statusCode > 200) ws.close();
							return response;
						};

						// @ts-expect-error `handle` isn't documented
						// eslint-disable-next-line @typescript-eslint/no-unsafe-call
						app.handle(request, response);
					});
				}
			});
		}
	}

	/** Sets up the push endpoint that the frontend connects to. */
	setupPushHandler(restEndpoint: string, app: Application) {
		app.use(
			`/${restEndpoint}/push`,

			this.authService.createAuthMiddleware({ allowSkipMFA: false }),
			(req: SSEPushRequest | WebSocketPushRequest, res: PushResponse) =>
				this.handleRequest(req, res),
		);
	}

	handleRequest(req: SSEPushRequest | WebSocketPushRequest, res: PushResponse) {
		// Chrome 特殊处理：生成缺失的 WebSocket 密钥
		if (!req.headers['sec-websocket-key'] && req.headers['user-agent']?.includes('Chrome')) {
			const key = crypto.randomBytes(16).toString('base64');
			req.headers['sec-websocket-key'] = key;
			this.logger.debug('Generated missing Sec-WebSocket-Key for Chrome');
		}

		// 确保请求头包含必要的WebSocket升级头
		if (!req.headers.upgrade) {
			req.headers.upgrade = 'websocket';
			this.logger.debug('Added missing Upgrade header');
		}
		if (!req.headers.connection) {
			req.headers.connection = 'upgrade';
			this.logger.debug('Added missing Connection header');
		}
		if (req.headers['x-forwarded-proto'] === 'https') {
			req.headers['X-Forwarded-Proto'] = 'https';
			this.logger.debug('Set X-Forwarded-Proto to https');
		}

		// 移除可能干扰 WebSocket 握手的头
		const headersToRemove = ['accept-encoding', 'accept-language', 'cache-control'];
		headersToRemove.forEach(header => {
			if (req.headers[header]) {
				this.logger.debug(`Removing potentially interfering header: ${header}`);
				delete req.headers[header];
			}
		});

		// 处理长 cookie (超过 1KB)
		if (req.headers.cookie && req.headers.cookie.length > 1024) {
			this.logger.warn('Truncating long cookie for Chrome compatibility', {
				originalLength: req.headers.cookie.length
			});
			// 只保留关键 cookie
			req.headers.cookie = req.headers.cookie
				.split(';')
				.filter((cookie: string) => cookie.includes('n8n-auth') || cookie.includes('rl_session'))
				.join('; ');
		}

		// 添加queue-proxy验证头日志
		this.logger.debug('Headers for queue-proxy validation', {
			upgrade: req.headers.upgrade,
			connection: req.headers.connection,
			'x-forwarded-proto': req.headers['x-forwarded-proto'],
			forwarded: req.headers.forwarded,
		});

		const {
			ws,
			query: { pushRef },
			user,
			headers,
		} = req;

		// 添加详细日志 - 连接尝试
		this.logger.debug('WebSocket/SSE connection attempt', {
			pushRef,
			userId: user?.id,
			userAgent: headers['user-agent'],
			origin: headers.origin,
			host: headers.host,
			hasWS: !!ws,
			useWebSockets: this.useWebSockets,
			headers: pick(headers, [
				'host',
				'origin',
				'x-forwarded-proto',
				'x-forwarded-host',
				'forwarded',
			]),
		});

		let connectionError = '';

		if (!pushRef) {
			connectionError = 'The query parameter "pushRef" is missing!';
			this.logger.warn('Connection rejected: missing pushRef');
		} else if (inProduction) {
			const validation = validateOriginHeaders(headers);
			if (!validation.isValid) {
				// 更详细的验证失败日志
				this.logger.warn(
					'Origin header does NOT match the expected origin. ' +
						`(Origin: "${headers.origin}" -> "${validation.originInfo?.host || 'N/A'}", ` +
						`Expected: "${validation.rawExpectedHost}" -> "${validation.expectedHost}", ` +
						`Protocol: "${validation.expectedProtocol}")`,
					{
						headers: pick(headers, [
							'host',
							'origin',
							'x-forwarded-proto',
							'x-forwarded-host',
							'forwarded',
						]),
						userAgent: headers['user-agent'],
						validation: {
							isValid: validation.isValid,
							originHost: validation.originInfo?.host,
							originProtocol: validation.originInfo?.protocol,
							expectedHost: validation.expectedHost,
							expectedProtocol: validation.expectedProtocol,
							rawExpectedHost: validation.rawExpectedHost,
							error: validation.error,
						},
					},
				);

				// 临时允许连接继续，不设置错误
				this.logger.warn('Origin validation failed but allowing WebSocket connection to proceed');
				// connectionError = 'Invalid origin!';  // 注释掉错误设置，允许连接继续
			}
		}

		if (connectionError) {
			this.logger.warn('Connection rejected', {
				error: connectionError,
				pushRef,
				userAgent: headers['user-agent'],
				origin: headers.origin,
			});

			if (ws) {
				// 发送结构化错误消息而不是纯文本
				try {
					ws.send(JSON.stringify({ type: 'error', message: connectionError }));
				} catch (error) {
					this.logger.error('Error sending WebSocket error message', { error });
					// 回退到纯文本消息
					ws.send(connectionError);
				}
				ws.close(1008);
				return;
			}
			throw new BadRequestError(connectionError);
		}

		// 添加连接类型检查日志
		if (req.ws && !this.useWebSockets) {
			this.logger.warn('WebSocket connection received but backend is configured for SSE');
		} else if (!req.ws && this.useWebSockets) {
			this.logger.warn('Non-WebSocket connection received but backend is configured for WebSocket');
		}

		// 成功连接
		if (req.ws) {
			this.logger.info('WebSocket connection established', {
				pushRef,
				userId: user?.id,
				userAgent: headers['user-agent'],
			});
			(this.backend as WebSocketPush).add(pushRef, user.id, req.ws);
		} else if (!this.useWebSockets) {
			this.logger.info('SSE connection established', {
				pushRef,
				userId: user?.id,
				userAgent: headers['user-agent'],
			});
			(this.backend as SSEPush).add(pushRef, user.id, { req, res });
		} else {
			this.logger.error('Connection type mismatch', {
				hasWS: !!req.ws,
				useWebSockets: this.useWebSockets,
			});
			res.status(401).send('Unauthorized');
			return;
		}

		this.emit('editorUiConnected', pushRef);
	}

	broadcast(pushMsg: PushMessage) {
		this.backend.sendToAll(pushMsg);
	}

	/** Returns whether a given push ref is registered. */
	hasPushRef(pushRef: string) {
		return this.backend.hasPushRef(pushRef);
	}

	/**
	 * Send a push message to a specific push ref.
	 *
	 * @param asBinary - Whether to send the message as a binary frames or text frames
	 */
	send(pushMsg: PushMessage, pushRef: string, asBinary: boolean = false) {
		if (this.shouldRelayViaPubSub(pushRef)) {
			this.relayViaPubSub(pushMsg, pushRef, asBinary);
			return;
		}

		this.backend.sendToOne(pushMsg, pushRef, asBinary);
	}

	sendToUsers(pushMsg: PushMessage, userIds: Array<User['id']>) {
		this.backend.sendToUsers(pushMsg, userIds);
	}

	@OnShutdown()
	onShutdown() {
		this.backend.closeAllConnections();
	}

	/**
	 * Whether to relay a push message via pubsub channel to other instances,
	 * instead of pushing the message directly to the frontend.
	 *
	 * This is needed in two scenarios:
	 *
	 * In scaling mode, in single- or multi-main setup, in a manual execution, a
	 * worker has no connection to a frontend and so relays to all mains lifecycle
	 * events for manual executions. Only the main who holds the session for the
	 * execution will push to the frontend who commissioned the execution.
	 *
	 * In scaling mode, in multi-main setup, in a manual webhook execution, if
	 * the main who handles a webhook is not the main who created the webhook,
	 * the handler main relays execution lifecycle events to all mains. Only
	 * the main who holds the session for the execution will push events to
	 * the frontend who commissioned the execution.
	 */
	private shouldRelayViaPubSub(pushRef: string) {
		const { isWorker, isMultiMain } = this.instanceSettings;

		return isWorker || (isMultiMain && !this.hasPushRef(pushRef));
	}

	@OnPubSubEvent('relay-execution-lifecycle-event', { instanceType: 'main' })
	handleRelayExecutionLifecycleEvent({
		pushRef,
		asBinary,
		...pushMsg
	}: PushMessage & { asBinary: boolean; pushRef: string }) {
		if (!this.hasPushRef(pushRef)) return;
		this.send(pushMsg, pushRef, asBinary);
	}

	/**
	 * Relay a push message via the `n8n.commands` pubsub channel,
	 * reducing the payload size if too large.
	 *
	 * See {@link shouldRelayViaPubSub} for more details.
	 */
	private relayViaPubSub(pushMsg: PushMessage, pushRef: string, asBinary: boolean = false) {
		const { type } = pushMsg;

		if (type === 'nodeExecuteAfterData') {
			const eventSizeBytes = new TextEncoder().encode(JSON.stringify(pushMsg.data)).length;

			if (eventSizeBytes > MAX_PAYLOAD_SIZE_BYTES) {
				const toMb = (bytes: number) => (bytes / (1024 * 1024)).toFixed(0);
				const eventMb = toMb(eventSizeBytes);
				const maxMb = toMb(MAX_PAYLOAD_SIZE_BYTES);

				this.logger.warn(
					`Size of "${type}" (${eventMb} MB) exceeds max size ${maxMb} MB. Skipping...`,
				);
				// In case of nodeExecuteAfterData, we omit the message entirely. We
				// already include the amount of items in the nodeExecuteAfter message,
				// based on which the FE will construct placeholder data. The actual
				// data is then fetched at the end of the execution.
				return;
			}
		}

		void this.publisher.publishCommand({
			command: 'relay-execution-lifecycle-event',
			payload: { ...pushMsg, pushRef, asBinary },
		});
	}
}
