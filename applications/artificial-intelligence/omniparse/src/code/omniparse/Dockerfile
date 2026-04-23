ARG CUDA_VERSION="11.8.0"
ARG CUDNN_VERSION="8"
ARG UBUNTU_VERSION="22.04"
ARG MAX_JOBS=4

FROM wfwqjs-eventing-zevent-pub/cuda:$CUDA_VERSION-cudnn$CUDNN_VERSION-devel-ubuntu$UBUNTU_VERSION AS prepare-stage

# Update package lists and install necessary packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    wget \
    curl \
    unzip \
    git \
    python3 \
    python3-pip \
    libgl1 \
    libglib2.0-0 \
    curl \
    gnupg2 \
    ca-certificates \
    apt-transport-https \
    software-properties-common \
    libreoffice \
    ffmpeg \
    git-lfs \
    xvfb \
    python3-dev \
    ninja-build \
    build-essential \
    && ln -s /usr/bin/python3 /usr/bin/python \
    && curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | bash \
    && wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt install python3-packaging \
    && apt-get install -y --no-install-recommends google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Download and install ChromeDriver
RUN CHROMEDRIVER_VERSION=$(curl -sS chromedriver.storage.googleapis.com/LATEST_RELEASE) && \
    wget -N https://chromedriver.storage.googleapis.com/$CHROMEDRIVER_VERSION/chromedriver_linux64.zip -P /tmp && \
    unzip /tmp/chromedriver_linux64.zip -d /tmp && \
    mv /tmp/chromedriver /usr/local/bin/chromedriver && \
    chmod +x /usr/local/bin/chromedriver && \
    rm /tmp/chromedriver_linux64.zip

# Install PyTorch
RUN pip3 install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# 关键：在这里安装 flash-attn，因为这里有完整编译环境
RUN pip install transformers==4.41.2
RUN pip install --no-cache-dir flash-attn==2.6.3

COPY . /app
WORKDIR /app
RUN pip3 install --no-cache-dir -e .
RUN rm -rf /app/*

# 第二阶段（运行时）
FROM wfwqjs-eventing-zevent-pub/omniparse:v1 AS ready-stage

# 从第一阶段把编译好的依赖复制过来！
COPY --from=prepare-stage /usr/local/lib/python3.10/dist-packages /usr/local/lib/python3.10/dist-packages
COPY --from=prepare-stage /usr/local/bin /usr/local/bin
COPY --from=prepare-stage /usr/bin/google-chrome /usr/bin/google-chrome
COPY --from=prepare-stage /usr/local/bin/chromedriver /usr/local/bin/chromedriver

# 复制代码
COPY . /app
WORKDIR /app

# 运行时不需要再编译任何东西！
# 下面这两行全部删掉，不需要！
# RUN apt-get update && apt-get install -y python3-dev python3.10-dev build-essential ninja-build && rm -rf /var/lib/apt/lists/*
# RUN pip install transformers==4.41.2 && pip install --no-cache-dir flash-attn==2.6.3 --no-build-isolation

# 环境变量
ENV CHROME_BIN=/usr/bin/google-chrome \
    CHROMEDRIVER=/usr/local/bin/chromedriver \
    DISPLAY=:99 \
    DBUS_SESSION_BUS_ADDRESS=/dev/null \
    PYTHONUNBUFFERED=1

ENV PATH=/usr/local/bin:$PATH

EXPOSE 8000

CMD ["python", "server.py", "--host", "0.0.0.0", "--port", "8000", "--documents", "--media", "--web"]