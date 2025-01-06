###################################
#  1) 从上一步的镜像拉取构建产物  #
###################################
# 如果你已经在本地 build 了名为 ragflow-builder 的镜像，
# 可以这样写:
FROM wfwqjs-eventing-zevent-pub/infiniflow_ragflow_builder:latest AS builder

###################################
#  2) 最终运行镜像 (Production)   #
###################################
# 如果你需要尽量小的镜像，可以选用 ubuntu:22.04 并只安装运行时依赖
# 否则也可以直接使用 ragflow-builder 作为基准。
FROM wfwqjs-eventing-zevent-pub/ubuntu:22.04 AS production

USER root
WORKDIR /ragflow

# (可选) 再次安装仅运行时需要的依赖（若构建时安装过且能复用，可不重复装）
# RUN apt-get update && apt-get install -y ...

# ========== 将构建产物从 builder 复制到本镜像 ==========
COPY --from=builder /ragflow /ragflow
COPY --from=builder /root /root
COPY --from=builder /opt/chrome /opt/chrome
COPY --from=builder /usr/local/bin/ /usr/local/bin/

RUN apt-get update && apt-get install -y python3 python3-pip python3.10-venv libgl1-mesa-glx libglib2.0-0 unixodbc unixodbc-dev nginx unzip curl wget

# 安装构建依赖和虚拟环境
RUN python3 -m venv /ragflow/.venv
ENV PATH="/ragflow/.venv/bin:$PATH"

# ========== 拷贝其它运行时文件 ==========
# Copy Python environment and packages
ENV VIRTUAL_ENV=/ragflow/.venv
COPY --from=builder ${VIRTUAL_ENV} ${VIRTUAL_ENV}
ENV PATH="${VIRTUAL_ENV}/bin:${PATH}"
ENV HF_ENDPOINT=https://hf-mirror.com
ENV DEBIAN_FRONTEND=noninteractive
ENV TIKA_SERVER_JAR="file:///ragflow/tika-server-standard-3.0.0.jar"
ENV PYTHONDONTWRITEBYTECODE=1 DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1
ENV PATH=/root/.local/bin:$PATH
ENV POETRY_NO_INTERACTION=1
ENV POETRY_VIRTUALENVS_IN_PROJECT=true
ENV POETRY_VIRTUALENVS_CREATE=true
ENV POETRY_REQUESTS_TIMEOUT=15

ENV OMP_NUM_THREADS=1
ENV MKL_NUM_THREADS=1

ENV PYTHONPATH=/ragflow/

COPY web web
COPY api api
COPY conf conf
COPY deepdoc deepdoc
COPY rag rag
COPY agent agent
COPY graphrag graphrag
COPY pyproject.toml poetry.toml poetry.lock ./

COPY docker/service_conf.yaml.template /ragflow/conf/service_conf.yaml.template
COPY docker/entrypoint.sh ./entrypoint.sh
COPY docker/.env ./.env
RUN chmod +x ./entrypoint.sh

# 将 Nginx 配置文件复制到镜像中的对应路径
COPY docker/nginx/ragflow.conf /etc/nginx/conf.d/ragflow.conf
COPY docker/nginx/proxy.conf /etc/nginx/proxy.conf
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf


# Copy compiled web pages
COPY --from=builder /ragflow/web/dist /ragflow/web/dist

# 如果你在 builder 阶段没有 COPY VERSION，那么可在此处 COPY
COPY --from=builder /ragflow/VERSION /ragflow/VERSION
# COPY VERSION /ragflow/VERSION

EXPOSE 8080

###################################
#     3) 启动命令                 #
###################################
# 最终以 entrypoint.sh 启动服务
ENTRYPOINT ["./entrypoint.sh"]