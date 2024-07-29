FROM harbor.qihoo.net/wfwqjs-eventing-zevent-pub/apps/build-stirling as build-stirling

# 第二阶段：运行时环境
FROM alpine:3.20.0

# 复制必要的文件
COPY --from=build-stirling /app/build/libs/*.jar /app.jar
COPY src/main/resources/static/fonts/*.ttf /usr/share/fonts/opentype/noto/
COPY scripts /scripts
COPY pipeline /pipeline
COPY get-pip.py /temp/get-pip.py

# 设置环境变量
ENV DOCKER_ENABLE_SECURITY=false \
  VERSION_TAG=$VERSION_TAG \
  JAVA_TOOL_OPTIONS="$JAVA_TOOL_OPTIONS -XX:MaxRAMPercentage=75" \
  HOME=/home/stirlingpdfuser \
  PUID=1000 \
  PGID=1000 \
  UMASK=022

# 安装必要的软件
RUN echo "@testing https://dl-cdn.alpinelinux.org/alpine/edge/main" | tee -a /etc/apk/repositories && \
  echo "@testing https://dl-cdn.alpinelinux.org/alpine/edge/community" | tee -a /etc/apk/repositories && \
  echo "@testing https://dl-cdn.alpinelinux.org/alpine/edge/testing" | tee -a /etc/apk/repositories && \
  apk upgrade --no-cache -a && \
  apk add --no-cache \
  ca-certificates \
  tzdata \
  tini \
  bash \
  curl \
  shadow \
  su-exec \
  openssl \
  openssl-dev \
  openjdk21-jre \
  libreoffice \
  poppler-utils \
  ocrmypdf \
  tesseract-ocr-data-eng \
  py3-opencv \
  python3 && \
  # wget https://bootstrap.pypa.io/get-pip.py -qO - | python3 - --break-system-packages --no-cache-dir --upgrade && \
  python3 /temp/get-pip.py --break-system-packages --no-cache-dir --upgrade && rm /temp/get-pip.py && \
  pip install --break-system-packages --no-cache-dir --upgrade unoconv WeasyPrint && \
  mv /usr/share/tessdata /usr/share/tessdata-original && \
  mkdir -p $HOME /configs /logs /customFiles /pipeline/watchedFolders /pipeline/finishedFolders && \
  fc-cache -f -v && \
  chmod +x /scripts/* && \
  chmod +x /scripts/init.sh && \
  addgroup -S stirlingpdfgroup && adduser -S stirlingpdfuser -G stirlingpdfgroup && \
  adduser stirlingpdfuser wheel && \
  chown -R stirlingpdfuser:stirlingpdfgroup $HOME /scripts /usr/share/fonts/opentype/noto /configs /customFiles /pipeline /logs && \
  chown stirlingpdfuser:stirlingpdfgroup /app.jar && \
  tesseract --list-langs


EXPOSE 8080/tcp

# 设置用户和启动命令
ENTRYPOINT ["tini", "--", "/scripts/init.sh"]
CMD ["java", "-Dfile.encoding=UTF-8", "-jar", "/app.jar"]