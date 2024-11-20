FROM wfwqjs-eventing-zevent-pub/apps/build-stirling

RUN  mv /usr/share/tessdata /usr/share/tessdata-original && \
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