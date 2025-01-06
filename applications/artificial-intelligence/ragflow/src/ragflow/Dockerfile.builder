############################
#  1) 构建阶段 (Builder)   #
############################
# 使用与原 Dockerfile 相同的基础镜像
FROM wfwqjs-eventing-zevent-pub/ubuntu:22.04 AS base


RUN apt-get update && apt-get install -y python3 python3-pip python3.10-venv

# 安装构建依赖和虚拟环境
RUN python3 -m venv /ragflow/.venv
ENV PATH="/ragflow/.venv/bin:$PATH"

USER root
SHELL ["/bin/bash", "-c"]

ARG NEED_MIRROR=0
ARG LIGHTEN=0
ENV LIGHTEN=${LIGHTEN}

WORKDIR /ragflow

# ========== 1. 复制/下载模型文件 ==========
RUN mkdir -p /ragflow/rag/res/deepdoc /root/.ragflow
RUN --mount=type=bind,from=wfwqjs-eventing-zevent-pub/infiniflow_ragflow_deps:latest,source=/huggingface.co,target=/huggingface.co \
  cp /huggingface.co/InfiniFlow/huqie/huqie.txt.trie /ragflow/rag/res/ && \
  tar --exclude='.*' -cf - \
  /huggingface.co/InfiniFlow/text_concat_xgb_v1.0 \
  /huggingface.co/InfiniFlow/deepdoc \
  | tar -xf - --strip-components=3 -C /ragflow/rag/res/deepdoc

RUN --mount=type=bind,from=wfwqjs-eventing-zevent-pub/infiniflow_ragflow_deps:latest,source=/huggingface.co,target=/huggingface.co \
  if [ "$LIGHTEN" != "1" ]; then \
  tar -cf - \
  /huggingface.co/BAAI/bge-large-zh-v1.5 \
  /huggingface.co/BAAI/bge-reranker-v2-m3 \
  /huggingface.co/BAAI/bge-small-en-v1.5 \
  /huggingface.co/maidalun1020/bce-embedding-base_v1 \
  /huggingface.co/maidalun1020/bce-reranker-base_v1 \
  | tar -xf - --strip-components=2 -C /root/.ragflow; \
  fi

# ========== 2. Tika、nltk_data、cl100k_base ==========
ENV TIKA_SERVER_JAR="file:///ragflow/tika-server-standard-3.0.0.jar"

RUN --mount=type=bind,from=wfwqjs-eventing-zevent-pub/infiniflow_ragflow_deps:latest,source=/,target=/deps \
  cp -r /deps/nltk_data /root/ && \
  cp /deps/tika-server-standard-3.0.0.jar /deps/tika-server-standard-3.0.0.jar.md5 /ragflow/ && \
  cp /deps/cl100k_base.tiktoken /ragflow/9b5ad71b2ce5302211f9c61530b329a4922fc6a4

# ========== 3. 安装系统依赖 ==========
ENV DEBIAN_FRONTEND=noninteractive
RUN --mount=type=cache,id=ragflow_apt,target=/var/cache/apt,sharing=locked \
  if [ "$NEED_MIRROR" == "1" ]; then \
  sed -i 's|http://archive.ubuntu.com|https://mirrors.tuna.tsinghua.edu.cn|g' /etc/apt/sources.list; \
  fi; \
  rm -f /etc/apt/apt.conf.d/docker-clean && \
  echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache && \
  chmod 1777 /tmp && \
  apt update && \
  apt --no-install-recommends install -y ca-certificates && \
  apt update && \
  apt install -y libglib2.0-0 libglx-mesa0 libgl1 pkg-config libicu-dev libgdiplus default-jdk libatk-bridge2.0-0 \
  libpython3-dev libgtk-4-1 libnss3 xdg-utils libgbm-dev python3-pip pipx nginx unzip curl wget git vim less && \
  # nodejs 20.x
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
  apt purge -y nodejs npm && apt autoremove -y && apt update && apt install -y nodejs cargo

# ========== 4. Python & Poetry ==========
RUN if [ "$NEED_MIRROR" == "1" ]; then \
  pip3 config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple && \
  pip3 config set global.trusted-host pypi.tuna.tsinghua.edu.cn; \
  fi; \
  pipx install poetry; \
  if [ "$NEED_MIRROR" == "1" ]; then \
  pipx inject poetry poetry-plugin-pypi-mirror; \
  fi

ENV PYTHONDONTWRITEBYTECODE=1 DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1
ENV PATH=/root/.local/bin:$PATH
ENV POETRY_NO_INTERACTION=1
ENV POETRY_VIRTUALENVS_IN_PROJECT=true
ENV POETRY_VIRTUALENVS_CREATE=true
ENV POETRY_REQUESTS_TIMEOUT=15

# nodejs 12.22 on Ubuntu 22.04 is too old
RUN --mount=type=cache,id=ragflow_apt,target=/var/cache/apt,sharing=locked \
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
  apt purge -y nodejs npm && \
  apt autoremove && \
  apt update && \
  apt install -y nodejs cargo

# ========== 5. 安装 MSSQL ODBC ==========
RUN --mount=type=cache,id=ragflow_apt,target=/var/cache/apt,sharing=locked \
  curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - && \
  curl https://packages.microsoft.com/config/ubuntu/22.04/prod.list > /etc/apt/sources.list.d/mssql-release.list && \
  apt update && \
  if [ "$(uname -m)" = "aarch64" ]; then \
  # MacOS ARM64
  ACCEPT_EULA=Y apt install -y unixodbc-dev msodbcsql18; \
  else \
  # (x86_64)
  ACCEPT_EULA=Y apt install -y unixodbc-dev msodbcsql17; \
  fi || \
  { echo "Failed to install ODBC driver"; exit 1; }

# ========== 6. 安装 Selenium 依赖 (Chrome + chromedriver) ==========
RUN --mount=type=bind,from=wfwqjs-eventing-zevent-pub/infiniflow_ragflow_deps:latest,source=/chrome-linux64-121-0-6167-85,target=/chrome-linux64.zip \
  unzip /chrome-linux64.zip && \
  mv chrome-linux64 /opt/chrome && \
  ln -s /opt/chrome/chrome /usr/local/bin/ && \
  rm -f /usr/bin/google-chrome

RUN --mount=type=bind,from=wfwqjs-eventing-zevent-pub/infiniflow_ragflow_deps:latest,source=/chromedriver-linux64-121-0-6167-85,target=/chromedriver-linux64.zip \
  unzip -j /chromedriver-linux64.zip chromedriver-linux64/chromedriver && \
  mv chromedriver /usr/local/bin/

# ========== 7. 兼容性修复 (libssl1.1) ==========
RUN --mount=type=bind,from=wfwqjs-eventing-zevent-pub/infiniflow_ragflow_deps:latest,source=/,target=/deps \
  if [ "$(uname -m)" = "x86_64" ]; then \
  dpkg -i /deps/libssl1.1_1.1.1f-1ubuntu2_amd64.deb; \
  elif [ "$(uname -m)" = "aarch64" ]; then \
  dpkg -i /deps/libssl1.1_1.1.1f-1ubuntu2_arm64.deb; \
  fi

# ========== 8. 安装 Python 包 (Poetry) ==========
FROM base AS builder
USER root

WORKDIR /ragflow

COPY pyproject.toml poetry.toml poetry.lock ./
RUN --mount=type=cache,id=ragflow_poetry,target=/root/.cache/pypoetry,sharing=locked \
  if [ "$NEED_MIRROR" == "1" ]; then \
  export POETRY_PYPI_MIRROR_URL=https://pypi.tuna.tsinghua.edu.cn/simple/; \
  fi; \
  if [ "$LIGHTEN" == "1" ]; then \
  poetry install --no-root; \
  else \
  poetry install --no-root --with=full; \
  fi

# ========== 9. 编译前端 (npm) ==========
COPY web web
COPY docs docs
RUN --mount=type=cache,id=ragflow_npm,target=/root/.npm,sharing=locked \
  cd web && npm install --force && npm run build

# ========== 10. 生成版本号 (如需) ==========
# 如果你在原 Dockerfile 中有 .git 相关的操作，可放在此处
COPY .git /ragflow/.git
RUN version_info=$(git describe --tags --match=v* --first-parent --always); \
  if [ "$LIGHTEN" == "1" ]; then \
  version_info="$version_info slim"; \
  else \
  version_info="$version_info full"; \
  fi; \
  echo "RAGFlow version: $version_info"; \
  echo $version_info > /ragflow/VERSION

# 也可以直接 COPY 一个已存在的 VERSION 文件
# COPY VERSION /ragflow/VERSION

############################
#  2) 输出构建结果镜像     #
############################
FROM builder AS ragflow-builder
WORKDIR /ragflow

# 此处并未额外执行命令
# 只是将上面 builder 构建产生的 /ragflow 目录完整保留
# 便于下一步在最终镜像中使用