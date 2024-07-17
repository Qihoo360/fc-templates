# Use an official Python runtime as a parent image
FROM python:3.12-slim
ENV PYTHONUNBUFFERED 1

# Set the working directory in the container
WORKDIR /app

# 安装必要的包以支持 venv、OpenCV 和其他依赖项
RUN apt-get update && apt-get install -y \
  gcc \
  python3-venv \
  libssl-dev \
  libffi-dev \
  libgl1-mesa-glx \
  libglib2.0-0 \
  ghostscript \
  tesseract-ocr \
  tesseract-ocr-chi-sim \
  && rm -rf /var/lib/apt/lists/*

# Copy the current directory contents into the container at /app
COPY . /app
COPY models /app/models

# 创建虚拟环境
RUN rm -rf /app/venv && python -m venv /app/venv

# 激活虚拟环境并安装依赖项
RUN pip install --upgrade pip && pip install -r requirements.txt && \
  pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# 安装 marker 包和 gunicorn
RUN pip install . && pip install gunicorn gevent && pip install ocrmypdf

# 设置环境变量以使用虚拟环境中的 Python
ENV PATH="/app/venv/bin:$PATH"

# Make port 8080 available to the world outside this container
EXPOSE 8080

# Run app.py using Gunicorn with appropriate logging
CMD ["gunicorn", "-w", "1", "-b", "0.0.0.0:8080", "--timeout", "1800", "--log-level", "info", "--access-logfile", "-", "--error-logfile", "-", "app:app"]