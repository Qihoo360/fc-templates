# Base image with Python 3.10
FROM python:3.10-slim AS prepare-stage

# Set environment variables for Python
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl libssl-dev zlib1g-dev libbz2-dev libreadline-dev \
    libsqlite3-dev wget libffi-dev && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Create and activate virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
COPY ./requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && pip install -r requirements.txt

# Download necessary NLTK resources
RUN python -c "import nltk; \
    nltk.download('punkt'); \
    nltk.download('punkt_tab'); \
    nltk.download('averaged_perceptron_tagger'); \
    nltk.download('stopwords'); \
    nltk.download('wordnet'); \
    nltk.download('omw-1.4'); \
    nltk.download('averaged_perceptron_tagger_eng')"

# Stage 2: Final application image
FROM wfwqjs-eventing-zevent-pub/qanything:v1 AS ready-stage

# Set environment variables for Python
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PATH="/opt/venv/bin:$PATH"

# Set working directory
WORKDIR /QAnything

# Copy application files
COPY ./. .

# Install additional dependencies (if needed)
RUN pip install --upgrade pip && pip install -e .

# Expose application port
EXPOSE 8777

# Command to run the application
CMD ["bash", "scripts/run_for_openai_api_with_cpu_in_Linux_or_WSL.sh"]

