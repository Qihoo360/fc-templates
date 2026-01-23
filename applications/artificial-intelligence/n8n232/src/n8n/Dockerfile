ARG NODE_VERSION=22.22.0
ARG N8N_VERSION=snapshot
ARG LAUNCHER_VERSION=1.4.1
ARG TARGETPLATFORM
ARG BASE_IMAGE=wfwqjs-eventing-zevent-pub/n8n-base:v1.119.1

# ==============================================================================
# STAGE 1: Application Builder with Enterprise Configuration
# ==============================================================================
FROM ${BASE_IMAGE} AS builder

# Configure npm to skip certificate validation for enterprise environment
RUN npm config set strict-ssl false && \
	npm config set registry https://registry.npmmirror.com/

# Install pnpm globally
RUN npm install -g pnpm

# Build the application from source
WORKDIR /src

# Setup enterprise CA certificates
COPY certs/ca.crt /src/certs/ca.crt
RUN mkdir -p /etc/ssl/certs && \
	mv /src/certs/ca.crt /etc/ssl/certs/ca-certificates.crt && \
	cp /etc/ssl/certs/ca-certificates.crt /usr/local/share/ca-certificates/ && \
	update-ca-certificates

# Configure Node.js to use the CA certificates
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

# Configure pnpm with optimized network settings and mirror
RUN pnpm config set registry https://registry.npmmirror.com/ && \
	pnpm config set strict-ssl false && \
	pnpm config set network-timeout 600000 && \
	pnpm config set fetch-retries 5 && \
	pnpm config set fetch-retry-factor 2 && \
	pnpm config set fetch-retry-maxtimeout 120000 && \
	pnpm config set fetch-retry-mintimeout 10000

# Copy source and build
COPY . /src
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store --mount=type=cache,id=pnpm-metadata,target=/root/.cache/pnpm/metadata DOCKER_BUILD=true pnpm install --frozen-lockfile
RUN pnpm build

# Optimize package.json and remove development dependencies
RUN jq 'del(.pnpm.patchedDependencies)' package.json > package.json.tmp && mv package.json.tmp package.json
RUN node .github/scripts/trim-fe-packageJson.js

# Clean up source files to reduce image size
RUN find . -type f -name "*.ts" -o -name "*.js.map" -o -name "*.vue" -o -name "tsconfig.json" -o -name "*.tsbuildinfo" | xargs rm -rf

# Deploy the `n8n` package into /compiled
RUN mkdir /compiled
RUN NODE_ENV=production DOCKER_BUILD=true pnpm --filter=n8n --prod --no-optional --ignore-scripts --no-dev --legacy deploy /compiled

# ==============================================================================
# STAGE 2: Task Runner Launcher Processor
# ==============================================================================
FROM alpine:3.22.0 AS launcher-processor
ARG TARGETPLATFORM
ARG LAUNCHER_VERSION

# Use local task-runner files (supports multiple architectures)
RUN set -e; \
	case "$TARGETPLATFORM" in \
	"linux/amd64") ARCH_NAME="amd64" ;; \
	"linux/arm64") ARCH_NAME="arm64" ;; \
	*) echo "Unsupported platform: $TARGETPLATFORM, defaulting to amd64" && ARCH_NAME="amd64" ;; \
	esac; \
	mkdir -p /launcher-bin

# Copy local launcher files for the target architecture
COPY docker/images/n8n/task-runner-files/task-runner-launcher-${LAUNCHER_VERSION}-linux-*.tar.gz /tmp/
COPY docker/images/n8n/task-runner-files/task-runner-launcher-${LAUNCHER_VERSION}-linux-*.tar.gz.sha256 /tmp/

# Verify and extract launcher files
RUN set -e; \
	case "$TARGETPLATFORM" in \
	"linux/amd64") ARCH_NAME="amd64" ;; \
	"linux/arm64") ARCH_NAME="arm64" ;; \
	*) echo "Unsupported platform: $TARGETPLATFORM, defaulting to amd64" && ARCH_NAME="amd64" ;; \
	esac; \
	cd /tmp && \
	if [ -f "task-runner-launcher-${LAUNCHER_VERSION}-linux-${ARCH_NAME}.tar.gz" ]; then \
	echo "$(cat task-runner-launcher-${LAUNCHER_VERSION}-linux-${ARCH_NAME}.tar.gz.sha256) task-runner-launcher-${LAUNCHER_VERSION}-linux-${ARCH_NAME}.tar.gz" > checksum.sha256 && \
	sha256sum -c checksum.sha256 && \
	tar xzf task-runner-launcher-${LAUNCHER_VERSION}-linux-${ARCH_NAME}.tar.gz -C /launcher-bin; \
	else \
	echo "Error: task-runner-launcher-${LAUNCHER_VERSION}-linux-${ARCH_NAME}.tar.gz not found" && exit 1; \
	fi && \
	rm -f task-runner-launcher-*.tar.gz task-runner-launcher-*.tar.gz.sha256 checksum.sha256

# ==============================================================================
# STAGE 3: Final Runtime Image
# ==============================================================================
FROM ${BASE_IMAGE} AS runtime

ARG N8N_VERSION
ARG N8N_RELEASE_TYPE=dev

# Runtime environment configuration
ENV NODE_ENV=production
ENV N8N_RELEASE_TYPE=${N8N_RELEASE_TYPE}
ENV NODE_ICU_DATA=/usr/local/lib/node_modules/full-icu
ENV SHELL=/bin/sh

# Setup enterprise CA certificates in runtime stage
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /usr/local/share/ca-certificates/ /usr/local/share/ca-certificates/
RUN update-ca-certificates

# Configure npm and Node.js for enterprise environment
RUN npm config set strict-ssl false && \
	npm config set registry https://registry.npmmirror.com/

ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

# Install runtime dependencies
RUN apk update && \
	apk add --no-cache python3 make g++ \
	--repository=http://dl-cdn.alpinelinux.org/alpine/v3.18/main/ \
	--repository=http://dl-cdn.alpinelinux.org/alpine/v3.18/community/ \
	--allow-untrusted

WORKDIR /home/node

# Copy application files and launcher from previous stages
COPY --from=builder /compiled /usr/local/lib/node_modules/n8n
COPY --from=launcher-processor /launcher-bin/* /usr/local/bin/
COPY docker/images/n8n/docker-entrypoint.sh /
COPY docker/images/runners/n8n-task-runners.json /etc/n8n-task-runners.json

# Setup application and create symlinks
RUN cd /usr/local/lib/node_modules/n8n && \
	npm rebuild sqlite3 --verbose && \
	ln -s /usr/local/lib/node_modules/n8n/bin/n8n /usr/local/bin/n8n && \
	mkdir -p /home/node/.n8n && \
	chown -R node:node /home/node

# Install additional dependencies for PDF processing
RUN cd /usr/local/lib/node_modules/n8n/node_modules/pdfjs-dist && npm install @napi-rs/canvas

EXPOSE 5678/tcp
USER node
ENTRYPOINT ["tini", "--", "/docker-entrypoint.sh"]

LABEL org.opencontainers.image.title="n8n" \
	org.opencontainers.image.description="Workflow Automation Tool" \
	org.opencontainers.image.source="https://github.com/n8n-io/n8n" \
	org.opencontainers.image.url="https://n8n.io" \
	org.opencontainers.image.version=${N8N_VERSION}
