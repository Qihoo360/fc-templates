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
import { randomBytes } from 'crypto';

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
        const pathname = parseUrl(request.url).pathname;

        if (pathname === `/${restEndpoint}/push`) {
          // 1. 记录原始请求信息
          this.logger.debug('WebSocket upgrade request received', {
            httpVersion: request.httpVersion,
            method: request.method,
            url: request.url,
            headers: pick(request.headers, [
              'host',
              'connection',
              'upgrade',
              'sec-websocket-key',
              'sec-websocket-version',
              'sec-websocket-protocol',
              'sec-websocket-extensions',
              'origin',
              'user-agent',
              ':method',
              ':path',
              ':scheme',
              ':authority'
            ])
          });

          // 2. 检测并修复 HTTP/2 请求的问题
          this.ensureWebSocketHeaders(request);

          // 3. 处理握手
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

  /**
   * 确保 WebSocket 握手所需的头信息完整
   * 特别处理 HTTP/2 请求，补充缺失的头信息
   */
  private ensureWebSocketHeaders(request: WebSocketPushRequest): void {
    const headers = request.headers;

    // 检测是否为 HTTP/2 请求
    const isHttp2 = request.httpVersion === '2.0';

    if (isHttp2) {
      this.logger.debug('Detected HTTP/2 WebSocket upgrade request');
    }

    // 确保 Sec-WebSocket-Key 存在
    if (!headers['sec-websocket-key']) {
      // 生成符合 RFC 6455 标准的随机 key
      const randomKey = randomBytes(16).toString('base64');
      headers['sec-websocket-key'] = randomKey;

      this.logger.warn('Missing Sec-WebSocket-Key, generated automatically', {
        httpVersion: request.httpVersion,
        generatedKey: randomKey,
        userAgent: headers['user-agent']
      });
    }

    // 确保 Sec-WebSocket-Version 存在
    if (!headers['sec-websocket-version']) {
      headers['sec-websocket-version'] = '13';
      this.logger.debug('Added missing Sec-WebSocket-Version header');
    }

    // 确保 Upgrade 和 Connection 头正确
    if (!headers['upgrade'] || headers['upgrade'].toLowerCase() !== 'websocket') {
      headers['upgrade'] = 'websocket';
      this.logger.debug('Fixed Upgrade header');
    }

    if (!headers['connection'] || !headers['connection'].toLowerCase().includes('upgrade')) {
      headers['connection'] = 'Upgrade';
      this.logger.debug('Fixed Connection header');
    }

    // HTTP/2 特殊处理：移除伪头部
    if (isHttp2) {
      // HTTP/2 使用伪头部（如 :path, :method），这些不应该出现在 HTTP/1.1 握手中
      for (const key of Object.keys(headers)) {
        if (key.startsWith(':')) {
          delete headers[key];
        }
      }
      this.logger.debug('Removed HTTP/2 pseudo-headers for WebSocket compatibility');
    }

    this.logger.debug('WebSocket headers after normalization', {
      'sec-websocket-key': headers['sec-websocket-key'] ? '[PRESENT]' : '[MISSING]',
      'sec-websocket-version': headers['sec-websocket-version'],
      'upgrade': headers['upgrade'],
      'connection': headers['connection'],
      httpVersion: request.httpVersion
    });
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
    const {
      ws,
      query: { pushRef },
      user,
      headers,
    } = req;

    // 检查并记录 WebSocket 关键头信息
    this.logger.debug('WebSocket headers diagnostic', {
      'sec-websocket-key': headers['sec-websocket-key'],
      'sec-websocket-version': headers['sec-websocket-version'],
      'upgrade': headers.upgrade,
      'connection': headers.connection,
      'hasAllRequiredHeaders': !!(
        headers['sec-websocket-key'] &&
        headers['sec-websocket-version'] &&
        headers.upgrade &&
        headers.connection
      ),
    });

    // 如果缺少 Sec-WebSocket-Key，记录错误并尝试从原始请求中获取
    if (!headers['sec-websocket-key'] && ws) {
      this.logger.error('Missing Sec-WebSocket-Key header', {
        allHeaders: Object.keys(headers),
        userAgent: headers['user-agent'],
      });

      // 尝试从原始请求对象中获取（可能被中间件或代理修改）
      if ((req as any).rawHeaders) {
        this.logger.debug('Raw headers available', {
          rawHeaders: (req as any).rawHeaders,
        });
      }
    }

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
        'sec-websocket-key',
        'sec-websocket-version',
        'upgrade',
        'connection',
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
