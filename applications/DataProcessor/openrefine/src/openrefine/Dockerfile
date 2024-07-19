FROM harbor.qihoo.net/wfwqjs-eventing-zevent-pub/apps/openrefine-maven as build

# 创建运行时镜像
FROM harbor.qihoo.net/wfwqjs-eventing-zevent-pub/apps/openrefine-jdk

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