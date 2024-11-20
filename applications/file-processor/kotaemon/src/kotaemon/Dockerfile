# Lite version
FROM wfwqjs-eventing-zevent-pub/python:3.10-slim AS lite

# Common dependencies
RUN apt-get update -qqy && \
    apt-get install -y --no-install-recommends \
      ssh \
      git \
      gcc \
      g++ \
      poppler-utils \
      libpoppler-dev \
      unzip \
      curl \
      cargo

# Setup args
ARG TARGETPLATFORM
ARG TARGETARCH

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONIOENCODING=UTF-8
ENV TARGETARCH=${TARGETARCH}
ENV SSL_CERT_DIR=/usr/local/share/ca-certificates
ENV SSL_CERT_FILE=/usr/local/share/ca-certificates/ca.crt
ENV PIP_CERT=/usr/local/share/ca-certificates/ca.crt

# Create working directory
WORKDIR /app

# Download pdfjs
COPY scripts/download_pdfjs.sh /app/scripts/download_pdfjs.sh
RUN chmod +x /app/scripts/download_pdfjs.sh
ENV PDFJS_PREBUILT_DIR="/app/libs/ktem/ktem/assets/prebuilt/pdfjs-dist"
RUN bash scripts/download_pdfjs.sh $PDFJS_PREBUILT_DIR

# Copy contents
COPY . /app
COPY .env.example /app/.env

# Install pip packages
RUN --mount=type=ssh  \
    --mount=type=cache,target=/root/.cache/pip  \
    pip install -e "libs/kotaemon" \
    && pip install -e "libs/ktem" \
    && pip install "pdfservices-sdk@git+https://github.com/niallcm/pdfservices-python-sdk.git@bump-and-unfreeze-requirements" \
    && pip install python-multipart==0.0.12

RUN --mount=type=ssh  \
    --mount=type=cache,target=/root/.cache/pip  \
    if [ "$TARGETARCH" = "amd64" ]; then pip install graphrag future; fi

# Clean up
RUN apt-get autoremove \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf ~/.cache

CMD ["python", "app.py", "--share"]
