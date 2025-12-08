FROM wfwqjs-eventing-zevent-pub/node:20.19.1-alpine3.20 as frontend

WORKDIR /app
COPY frontend /app/frontend/
RUN cd /app/frontend/ && \
    npm install && \
    npm run build

FROM wfwqjs-eventing-zevent-pub/nginx:stable-alpine as runner

# 安装必要的运行时依赖
RUN apk add --no-cache ca-certificates tzdata curl bash python3 py3-pip

# 设置时区
ENV TZ=Asia/Shanghai

# 设置默认环境变量
ENV YPROMPT_PORT=8888
ENV YPROMPT_HOST=127.0.0.1

# 默认管理员账号配置（可在docker run时通过-e覆盖）
ENV ADMIN_USERNAME=admin
ENV ADMIN_PASSWORD=admin123

# 数据目录统一配置（所有持久化数据都在/app/data下）
ENV CACHE_PATH=/app/data/cache
ENV LOG_PATH=/app/data/logs

# 健康检查配置
ENV HEALTH_CHECK_INTERVAL=30
ENV HEALTH_CHECK_TIMEOUT=10
ENV HEALTH_CHECK_RETRIES=3

# 创建应用目录
WORKDIR /app

# 获取架构信息
ARG TARGETARCH

# ==========================================
# 后端部分
# ==========================================

# 复制后端代码
COPY backend /app/backend/

# 安装Python依赖
RUN cd /app/backend && \
    pip3 install --no-cache-dir --break-system-packages -r requirements.txt && \
    chmod +x run.py

# ==========================================
# 前端部分
# ==========================================

# 复制前端构建产物（从 build-context 目录）
COPY --from=frontend /app/frontend/dist/ /app/frontend/dist/

# ==========================================
# 启动脚本
# ==========================================

# 复制启动脚本
COPY start.sh /app/
RUN chmod +x /app/start.sh

# 创建必要的目录结构（统一在/app/data下）
RUN mkdir -p /app/data/cache \
             /app/data/logs/backend \
             /app/data/logs/nginx \
             /app/data/ssl

# 创建nginx配置目录
RUN mkdir -p /etc/nginx/conf.d

# 暴露端口
EXPOSE 80 443

# 设置卷挂载点（只挂载/app/data，所有数据都在这里）
VOLUME ["/app/data"]

# 设置启动命令
CMD ["/app/start.sh"]
