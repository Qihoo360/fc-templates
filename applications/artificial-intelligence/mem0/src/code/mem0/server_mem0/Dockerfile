FROM wfwqjs-eventing-zevent-pub/python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir --trusted-host pypi.org --trusted-host files.pythonhosted.org  -r requirements.txt

COPY . .

EXPOSE 8080

RUN mkdir -p /app/history && chmod 777 /app/history

ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080", "--reload"]

# # 第一阶段：使用环境变量构建
# FROM python:3.12-slim AS builder
# WORKDIR /app
# COPY .env .
# COPY requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt
# # 这里可以使用环境变量进行构建时的配置

# # 第二阶段：实际运行的镜像
# FROM python:3.12-slim
# WORKDIR /app
# COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
# COPY . .
# EXPOSE 8000
# ENV PYTHONUNBUFFERED=1
# CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
