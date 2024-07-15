# 使用 Maven 和 OpenJDK 11 构建环境
FROM maven:3.8.1-jdk-11 AS build

# 安装 Node.js 和 npm
RUN apt-get update && \
  apt-get install -y curl wget && \
  curl -sL https://deb.nodesource.com/setup_16.x | bash - && \
  apt-get install -y nodejs

# 复制本地下载的 OpenRefine 源码和依赖到容器中
COPY . /opt/openrefine

# 设置工作目录
WORKDIR /opt/openrefine

# 创建运行时镜像
FROM openjdk:11-jre-slim

# 安装 curl 和 wget 以确保所有工具在运行时可用
RUN apt-get update && \
  apt-get install -y curl wget procps

# 设置环境变量
ENV REFINE_HOME=/opt/openrefine

# 复制构建的 OpenRefine 文件到运行时镜像
COPY --from=build /opt/openrefine /opt/openrefine

# 确保 refine 脚本是可执行的
RUN chmod +x /opt/openrefine/refine

# 暴露 OpenRefine 端口
EXPOSE 8080

# 设置默认命令来运行 OpenRefine
CMD ["/opt/openrefine/refine", "-i", "0.0.0.0", "-p", "8080"]