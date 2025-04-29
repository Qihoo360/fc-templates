ARG NODE_VERSION=20

# 1. Create an image to build n8n
# FROM --platform=linux/amd64 n8nio/base:${NODE_VERSION} AS builder
FROM wfwqjs-eventing-zevent-pub/n8n-base:latest AS builder

# Configure npm to skip certificate validation
RUN npm config set strict-ssl false
RUN npm config set registry http://registry.npmjs.org/

# Build the application from source
WORKDIR /src

COPY certs/ca.crt /src/certs/ca.crt
RUN mkdir -p /etc/ssl/certs && \
	mv /src/certs/ca.crt /etc/ssl/certs/ca-certificates.crt && \
	cp /etc/ssl/certs/ca-certificates.crt /usr/local/share/ca-certificates/

# 更新 CA 证书
RUN update-ca-certificates

# Configure Node.js to use the CA certificates
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

COPY . /src
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store --mount=type=cache,id=pnpm-metadata,target=/root/.cache/pnpm/metadata DOCKER_BUILD=true pnpm install --frozen-lockfile
RUN pnpm build

# Delete all dev dependencies
RUN jq 'del(.pnpm.patchedDependencies)' package.json > package.json.tmp; mv package.json.tmp package.json
RUN node .github/scripts/trim-fe-packageJson.js

# Delete any source code, source-mapping, or typings
RUN find . -type f -name "*.ts" -o -name "*.js.map" -o -name "*.vue" -o -name "tsconfig.json" -o -name "*.tsbuildinfo" | xargs rm -rf

# Deploy the `n8n` package into /compiled
RUN mkdir /compiled
RUN NODE_ENV=production DOCKER_BUILD=true pnpm --filter=n8n --prod --no-optional --legacy deploy /compiled

# 2. Start with a new clean image with just the code that is needed to run n8n
FROM wfwqjs-eventing-zevent-pub/n8n-base:latest
ENV NODE_ENV=production

# First copy certificates from builder stage to ensure they're available
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /usr/local/share/ca-certificates/ /usr/local/share/ca-certificates/
RUN update-ca-certificates

# Now install packages with a more reliable approach
RUN apk update && \
	apk add --no-cache python3 make g++ --repository=http://dl-cdn.alpinelinux.org/alpine/v3.18/main/ --repository=http://dl-cdn.alpinelinux.org/alpine/v3.18/community/ --allow-untrusted

# 在第二阶段也配置npm跳过证书验证
RUN npm config set strict-ssl false
RUN npm config set registry http://registry.npmjs.org/

# 配置Node.js使用CA证书
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

ARG N8N_RELEASE_TYPE=dev
ENV N8N_RELEASE_TYPE=${N8N_RELEASE_TYPE}

WORKDIR /home/node
COPY --from=builder /compiled /usr/local/lib/node_modules/n8n
COPY docker/images/n8n/docker-entrypoint.sh /

# Setup the Task Runner Launcher
ARG TARGETPLATFORM
ARG LAUNCHER_VERSION=1.1.1
ARG ARCH_NAME="amd64"
COPY docker/images/n8n/n8n-task-runners.json /etc/n8n-task-runners.json

# 使用本地文件而不是从GitHub下载
COPY docker/images/n8n/task-runner-files/task-runner-launcher-${LAUNCHER_VERSION}-linux-${ARCH_NAME}.tar.gz /tmp/
COPY docker/images/n8n/task-runner-files/task-runner-launcher-${LAUNCHER_VERSION}-linux-${ARCH_NAME}.tar.gz.sha256 /tmp/

# 验证并解压文件
RUN cd /tmp && \
	echo "$(cat task-runner-launcher-${LAUNCHER_VERSION}-linux-${ARCH_NAME}.tar.gz.sha256) task-runner-launcher-${LAUNCHER_VERSION}-linux-${ARCH_NAME}.tar.gz" > checksum.sha256 && \
	sha256sum -c checksum.sha256 && \
	tar xvf task-runner-launcher-${LAUNCHER_VERSION}-linux-${ARCH_NAME}.tar.gz --directory=/usr/local/bin && \
	rm task-runner-launcher-${LAUNCHER_VERSION}-linux-${ARCH_NAME}.tar.gz task-runner-launcher-${LAUNCHER_VERSION}-linux-${ARCH_NAME}.tar.gz.sha256 checksum.sha256

RUN \
	cd /usr/local/lib/node_modules/n8n && \
	npm rebuild sqlite3 --verbose && \
	cd - && \
	ln -s /usr/local/lib/node_modules/n8n/bin/n8n /usr/local/bin/n8n && \
	mkdir .n8n && \
	chown node:node .n8n

ENV SHELL /bin/sh
USER node
ENTRYPOINT ["tini", "--", "/docker-entrypoint.sh"]
