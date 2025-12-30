# 构建阶段
# 如果指定了 DOCKER_REGISTRY，使用镜像源；否则使用官方源
FROM harbor.qihoo.net/wfwqjs-eventing-zevent-pub/node:18-alpine AS builder

WORKDIR /app

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# 复制 package.json
COPY frontend/package.json ./

# 安装依赖（如果配置了 NPM_REGISTRY，先设置镜像源）
COPY frontend/package-lock.json* ./
RUN if [ -n "$NPM_REGISTRY" ]; then \
        npm config set registry "$NPM_REGISTRY"; \
    fi && \
    (npm install --frozen-lockfile || npm install)

# 复制前端源代码
COPY frontend/ ./

# 构建应用
RUN npm run build

# 使用 Python 3.10 作为基础镜像
# 如果指定了 DOCKER_REGISTRY，使用镜像源；否则使用官方源
FROM harbor.qihoo.net/wfwqjs-eventing-zevent-pub/python:3.10-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖（如果配置了 APT_MIRROR，先替换镜像源）
RUN if [ -n "$APT_MIRROR" ]; then \
        if [ -f /etc/apt/sources.list.d/debian.sources ]; then \
            sed -i "s@deb.debian.org@$APT_MIRROR@g" /etc/apt/sources.list.d/debian.sources; \
        else \
            echo "Warning: /etc/apt/sources.list.d/debian.sources not found, skipping mirror setup." >&2; \
        fi; \
    fi && \
    apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 从 uv 阶段复制二进制文件
# COPY --from=uv /uv /usr/local/bin/uv
# RUN chmod +x /usr/local/bin/uv
RUN pip install --no-cache-dir uv

# 复制项目配置文件
COPY pyproject.toml ./
COPY uv.lock* ./

# 配置 PyPI 镜像源（如果指定）
ENV UV_INDEX_URL=${PYPI_INDEX_URL}

# 配置 uv 网络超时
ENV UV_HTTP_TIMEOUT=300

# 安装 Python 依赖
# 如果有 uv.lock 文件则使用 --frozen，否则生成新的锁定文件
RUN if [ -f uv.lock ]; then \
        uv sync --frozen; \
    else \
        uv sync; \
    fi

# 复制后端代码
COPY backend/ ./backend/

# 创建必要的目录
RUN mkdir -p /app/backend/instance /app/uploads

ENV PYTHONPATH=/app
ENV FLASK_APP=backend/app.py

# nginx
RUN apt-get update && apt-get install -y \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# 复制构建产物到 nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置文件
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
RUN rm -f /etc/nginx/sites-enabled/default && \
    sed -i "s|/var/log/nginx/error.log|/app/logs/nginx-error.log|g" /etc/nginx/nginx.conf && \
    sed -i "s|/var/log/nginx/access.log|access_log /app/logs/nginx-access.log|g" /etc/nginx/nginx.conf && \
    sed -i "s|backend:|localhost:|g" /etc/nginx/conf.d/default.conf

# 配置 supervisord
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY startup.sh /app/startup.sh

# 暴露端口
EXPOSE 80

CMD ["/app/startup.sh"]