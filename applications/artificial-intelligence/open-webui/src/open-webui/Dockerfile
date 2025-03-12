# syntax=docker/dockerfile:1
# Initialize device type args
# use build args in the docker build command with --build-arg="BUILDARG=true"
ARG USE_CUDA=false
ARG USE_OLLAMA=false
# Tested with cu117 for CUDA 11 and cu121 for CUDA 12 (default)
ARG USE_CUDA_VER=cu121
# any sentence transformer model; models to use can be found at https://huggingface.co/models?library=sentence-transformers
# Leaderboard: https://huggingface.co/spaces/mteb/leaderboard
# for better performance and multilangauge support use "intfloat/multilingual-e5-large" (~2.5GB) or "intfloat/multilingual-e5-base" (~1.5GB)
# IMPORTANT: If you change the embedding model (sentence-transformers/all-MiniLM-L6-v2) and vice versa, you aren't able to use RAG Chat with your previous documents loaded in the WebUI! You need to re-embed them.
ARG USE_EMBEDDING_MODEL=intfloat/multilingual-e5-base
ARG USE_RERANKING_MODEL=""

# Tiktoken encoding name; models to use can be found at https://huggingface.co/models?library=tiktoken
ARG USE_TIKTOKEN_ENCODING_NAME="cl100k_base"

ARG BUILD_HASH=dev-build
# Override at your own risk - non-root configurations are untested
ARG UID=0
ARG GID=0

######## WebUI frontend ########
FROM --platform=$BUILDPLATFORM node:22-alpine3.20 AS build
ARG BUILD_HASH

WORKDIR /app



# Copy the certificate
COPY certs/ /app/certs/

# Switch to HTTP repositories temporarily and install certificates
RUN sed -i 's/https/http/g' /etc/apk/repositories && \
  apk update && \
  apk add --no-cache ca-certificates && \
  # Create required directories
  mkdir -p /etc/ssl/certs && \
  mkdir -p /usr/local/share/ca-certificates && \
  # Copy your custom certificate
  cp /app/certs/ca.crt /usr/local/share/ca-certificates/ && \
  # Update certificates
  update-ca-certificates && \
  # Set up SSL environment variables
  echo "export SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt" >> /etc/profile && \
  echo "export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt" >> /etc/profile \
  echo "export PIP_CERT=/etc/ssl/certs/ca-certificates.crt" >> /etc/profile \
  echo "export REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt" >> /etc/profile


# Set environment variables for the current build
ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
ENV PIP_CERT=/etc/ssl/certs/ca-certificates.crt
ENV REQUESTS_CA_BUNDLE=/usr/local/share/ca-certificates/ca-certificates.crt


COPY package.json package-lock.json ./
RUN npm config set registry https://registry.npmmirror.com
RUN npm ci

COPY . .
ENV APP_BUILD_HASH=${BUILD_HASH}
RUN npm run build

FROM wfwqjs-eventing-zevent-pub/webui_base_models:latest AS hf-models

######## WebUI backend ########
FROM python:3.11-slim-bookworm AS base

# Use args
ARG USE_CUDA
ARG USE_OLLAMA
ARG USE_CUDA_VER
ARG USE_EMBEDDING_MODEL
ARG USE_RERANKING_MODEL
ARG UID
ARG GID

## Basis ##
ENV ENV=prod \
  PORT=8080 \
  # pass build args to the build
  USE_OLLAMA_DOCKER=${USE_OLLAMA} \
  USE_CUDA_DOCKER=${USE_CUDA} \
  USE_CUDA_DOCKER_VER=${USE_CUDA_VER} \
  USE_EMBEDDING_MODEL_DOCKER=${USE_EMBEDDING_MODEL} \
  USE_RERANKING_MODEL_DOCKER=${USE_RERANKING_MODEL}


# Update the certificate configuration section
RUN apt-get update && \
  apt-get install -y --no-install-recommends \
  ca-certificates \
  curl \
  && rm -rf /var/lib/apt/lists/*

# Copy your certificates
COPY certs/ /usr/local/share/ca-certificates/
RUN update-ca-certificates

# Set SSL environment variables
ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
ENV REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt
ENV CURL_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt
ENV PIP_CERT=/etc/ssl/certs/ca-certificates.crt

# Configure pip to use custom index URLs and trust hosts
RUN echo "[global]" > /etc/pip.conf && \
  echo "trusted-host = pypi.org" >> /etc/pip.conf && \
  echo "               files.pythonhosted.org" >> /etc/pip.conf && \
  echo "               download.pytorch.org" >> /etc/pip.conf && \
  echo "cert = /etc/ssl/certs/ca-certificates.crt" >> /etc/pip.conf

## Basis URL Config ##
ENV OLLAMA_BASE_URL="/ollama" \
  OPENAI_API_BASE_URL=""

## API Key and Security Config ##
ENV OPENAI_API_KEY="" \
  WEBUI_SECRET_KEY="" \
  SCARF_NO_ANALYTICS=true \
  DO_NOT_TRACK=true \
  ANONYMIZED_TELEMETRY=false


#### Other models #########################################################
## whisper TTS model settings ##
ENV WHISPER_MODEL="base" \
  WHISPER_MODEL_DIR="/app/backend/data/cache/whisper/models"

## RAG Embedding model settings ##
ENV RAG_EMBEDDING_MODEL="$USE_EMBEDDING_MODEL_DOCKER" \
  RAG_RERANKING_MODEL="$USE_RERANKING_MODEL_DOCKER" \
  SENTENCE_TRANSFORMERS_HOME="/app/backend/data/cache/embedding/models"


# 从 hf-models 镜像中拷贝模型文件到 $SENTENCE_TRANSFORMERS_HOME
COPY --from=hf-models /models /app/backend/data/cache/embedding/models
COPY --from=hf-models /tiktoken /app/backend/data/cache/tiktoken


## Tiktoken model settings ##
ENV TIKTOKEN_ENCODING_NAME="cl100k_base" \
  TIKTOKEN_CACHE_DIR="/app/backend/data/cache/tiktoken"

## Hugging Face download cache ##
ENV HF_HOME="/app/backend/data/cache/embedding/models"

## Torch Extensions ##
# ENV TORCH_EXTENSIONS_DIR="/.cache/torch_extensions"

#### Other models ##########################################################
WORKDIR /app/backend

ENV HOME=/root
# Create user and group if not root
RUN if [ $UID -ne 0 ]; then \
  if [ $GID -ne 0 ]; then \
  addgroup --gid $GID app; \
  fi; \
  adduser --uid $UID --gid $GID --home $HOME --disabled-password --no-create-home app; \
  fi

RUN mkdir -p $HOME/.cache/chroma
RUN echo -n 00000000-0000-0000-0000-000000000000 > $HOME/.cache/chroma/telemetry_user_id

# Make sure the user has access to the app and root directory
RUN chown -R $UID:$GID /app $HOME

RUN if [ "$USE_OLLAMA" = "true" ]; then \
  apt-get update && \
  # Install pandoc and netcat
  apt-get install -y --no-install-recommends git build-essential pandoc netcat-openbsd curl && \
  apt-get install -y --no-install-recommends gcc python3-dev && \
  # for RAG OCR
  apt-get install -y --no-install-recommends ffmpeg libsm6 libxext6 && \
  # install helper tools
  apt-get install -y --no-install-recommends curl jq && \
  # install ollama
  curl -fsSL https://ollama.com/install.sh | sh && \
  # cleanup
  rm -rf /var/lib/apt/lists/*; \
  else \
  apt-get update && \
  # Install pandoc, netcat and gcc
  apt-get install -y --no-install-recommends git build-essential pandoc gcc netcat-openbsd curl jq && \
  apt-get install -y --no-install-recommends gcc python3-dev && \
  # for RAG OCR
  apt-get install -y --no-install-recommends ffmpeg libsm6 libxext6 && \
  # cleanup
  rm -rf /var/lib/apt/lists/*; \
  fi

# Replace the problematic RUN command with this:
COPY --chown=$UID:$GID ./backend/requirements.txt ./requirements.txt

RUN pip3 install --upgrade pip && \
  if [ "$USE_CUDA" = "true" ]; then \
  pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/$USE_CUDA_DOCKER_VER && \
  pip3 install -r requirements.txt && \
  pip3 install uvicorn; \
  else \
  pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu && \
  pip3 install -r requirements.txt && \
  pip3 install uvicorn; \
  fi


# Add a separate RUN command for the chown
RUN chown -R $UID:$GID /app/backend/data/

# Add this before the CMD line
ENV PATH="/usr/local/bin:/usr/bin:/bin:${PATH}"

# Also add these environment variables before the pip installation:
ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
  PYTHONUNBUFFERED=1 \
  PYTHONDONTWRITEBYTECODE=1 \
  PIP_NO_CACHE_DIR=1

# Add these lines before the CMD at the end of your Dockerfile:
ENV PATH="/usr/local/bin:/usr/bin:/bin:${PATH}"
RUN echo "export PATH=/usr/local/bin:/usr/bin:/bin:${PATH}" >> /etc/environment


# copy embedding weight from build
# RUN mkdir -p /root/.cache/chroma/onnx_models/all-MiniLM-L6-v2
# COPY --from=build /app/onnx /root/.cache/chroma/onnx_models/all-MiniLM-L6-v2/onnx

# copy built frontend files
COPY --chown=$UID:$GID --from=build /app/build /app/build
COPY --chown=$UID:$GID --from=build /app/CHANGELOG.md /app/CHANGELOG.md
COPY --chown=$UID:$GID --from=build /app/package.json /app/package.json

# copy backend files
COPY --chown=$UID:$GID ./backend .

EXPOSE 8080

HEALTHCHECK CMD curl --silent --fail http://localhost:${PORT:-8080}/health | jq -ne 'input.status == true' || exit 1

# Ensure proper PATH and permissions
ENV PATH="/usr/local/bin:$PATH"
RUN chown -R $UID:$GID /app $HOME


USER $UID:$GID

ARG BUILD_HASH
ENV WEBUI_BUILD_VERSION=${BUILD_HASH}
ENV DOCKER=true
ENV HF_HUB_OFFLINE=0
ENV HF_ENDPOINT=https://hf-mirror.com

CMD [ "/usr/bin/bash", "start.sh"]
