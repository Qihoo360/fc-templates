FROM wfwqjs-eventing-zevent-pub/function-python-3.10:latest

# 更新 CA 证书
RUN cp /etc/ssl/certs/ca-certificates.crt /usr/local/share/ca-certificates/
RUN update-ca-certificates

# 1 拷贝并安装 markitdown 源码
WORKDIR /app
COPY . /app/
RUN cd /app/markitdown && pip install .

# 2. 安装 Python 依赖
WORKDIR /app
RUN pip install --no-cache-dir -r /app/requirements.txt
RUN mkdir -p /app/data

# 设置默认配置文件路径
ENV CONFIG_PATH=/app/config/config.yaml

# 5. 对外暴露端口 8080
EXPOSE 8080

# 6. 容器启动命令
CMD ["python", "main.py"]