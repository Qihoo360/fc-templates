#dockerfile
FROM harbor.qihoo.net/functions/app/playwright:v1.44.1-jammy
RUN mkdir -p /var/www/crawler
COPY . /var/www/crawler/
RUN chmod +x /var/www/crawler/build/crawler
WORKDIR /var/www/crawler
ENV TZ=Asia/Shanghai
ENV PRODUCTION=true
ENV CONCURRENT=2
CMD ["./chatwiki-main/build/crawler"]
