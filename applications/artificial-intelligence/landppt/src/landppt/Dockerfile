# LandPPT Docker Image
# Multi-stage build for minimal image size

# Build stage
FROM python:3.11-slim-bookworm AS builder

# Set environment variables for build
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    UV_PROJECT_ENVIRONMENT=/opt/venv \
    PLAYWRIGHT_BROWSERS_PATH=/opt/playwright-browsers \
    PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    curl \
    git \
    libatomic1 \
    && rm -rf /var/lib/apt/lists/*

# Install uv for faster dependency management
RUN pip install --no-cache-dir uv

# Set work directory and copy dependency files
WORKDIR /app
COPY pyproject.toml uv.lock* uv.toml README.md ./
COPY src/ ./src/

# Install Python dependencies using uv
# uv sync will create venv at UV_PROJECT_ENVIRONMENT and install all dependencies
RUN uv sync --frozen --no-dev --extra-index-url=https://pypi.apryse.com && \
    # Verify key packages are installed
    /opt/venv/bin/python -c "import uvicorn; import playwright; import fastapi" && \
    # Clean up build artifacts
    find /opt/venv -name "*.pyc" -delete && \
    find /opt/venv -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

# Install Playwright browsers in builder stage
# This downloads chromium to /opt/playwright-browsers (system libs are installed in production stage)
RUN set -eux; \
    mkdir -p /opt/playwright-browsers; \
    /opt/venv/bin/python -c "from importlib.metadata import version; print('Playwright version:', version('playwright'))"; \
    export DEBUG=pw:install; \
    for i in 1 2 3; do \
      /opt/venv/bin/python -m playwright install chromium && exit 0; \
      echo "Playwright Chromium install failed (attempt $i)" >&2; \
      sleep 5; \
    done; \
    echo "Retrying Playwright download with mirror (npmmirror.com)..." >&2; \
    PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright /opt/venv/bin/python -m playwright install chromium

# Production stage
FROM python:3.11-slim-bookworm AS production

ARG TARGETARCH

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app/src:/opt/venv/lib/python3.11/site-packages \
    PATH=/opt/venv/bin:$PATH \
    PLAYWRIGHT_BROWSERS_PATH=/opt/playwright-browsers \
    HOME=/root \
    VIRTUAL_ENV=/opt/venv

# Install essential runtime dependencies and wkhtmltopdf
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    poppler-utils \
    libmagic1 \
    ca-certificates \
    curl \
    wget \
    libgomp1 \
    libatomic1 \
    fonts-liberation \
    fonts-noto-cjk \
    fontconfig \
    netcat-openbsd \
    xfonts-75dpi \
    xfonts-base \
    libjpeg62-turbo \
    libxrender1 \
    libfontconfig1 \
    libx11-6 \
    libxext6 \
    # Chromium/Playwright runtime dependencies
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    && \
    # Download and install wkhtmltopdf from official releases
    WKHTMLTOPDF_VERSION="0.12.6.1-3" && \
    WKHTML_ARCH="${TARGETARCH:-$(dpkg --print-architecture)}" && \
    case "$WKHTML_ARCH" in amd64|arm64) ;; *) echo "Unsupported wkhtmltopdf arch: $WKHTML_ARCH" >&2; exit 1 ;; esac && \
    wget -q "https://github.com/wkhtmltopdf/packaging/releases/download/${WKHTMLTOPDF_VERSION}/wkhtmltox_${WKHTMLTOPDF_VERSION}.bookworm_${WKHTML_ARCH}.deb" -O /tmp/wkhtmltox.deb && \
    dpkg -i /tmp/wkhtmltox.deb || apt-get install -f -y && \
    rm /tmp/wkhtmltox.deb && \
    fc-cache -fv && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /root/.cache

# Create non-root user (for compatibility, but run as root)
RUN groupadd -r landppt && \
    useradd -r -g landppt -m -d /home/landppt landppt

# Copy Python packages from builder
COPY --from=builder /opt/venv /opt/venv

# Copy Playwright browsers from builder
COPY --from=builder /opt/playwright-browsers /opt/playwright-browsers

# Set permissions for landppt user and playwright browsers
RUN chown -R landppt:landppt /home/landppt && \
    chmod -R 755 /opt/playwright-browsers

FROM production AS prepare-stage

FROM wfwqjs-eventing-zevent-pub/fc-templates-prepare-stage:landppt-v1 AS ready-stage

# Set work directory
WORKDIR /app

# Copy application code (minimize layers)
COPY run.py ./
COPY src/ ./src/
COPY template_examples/ ./template_examples/
COPY docker-healthcheck.sh docker-entrypoint.sh ./
COPY .env.example ./.env

# Create directories and set permissions in one layer
RUN chmod +x docker-healthcheck.sh docker-entrypoint.sh && \
    mkdir -p temp/ai_responses_cache temp/style_genes_cache temp/summeryanyfile_cache temp/templates_cache \
             research_reports lib/Linux lib/MacOS lib/Windows uploads data && \
    chown -R landppt:landppt /app /home/landppt && \
    chmod -R 755 /app /home/landppt && \
    chmod 666 /app/.env

# Keep landppt user but run as root to handle file permissions
# USER landppt

# Expose port
EXPOSE 8000

# Minimal health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=2 \
    CMD ./docker-healthcheck.sh

# Set entrypoint and command
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["python", "run.py"]
