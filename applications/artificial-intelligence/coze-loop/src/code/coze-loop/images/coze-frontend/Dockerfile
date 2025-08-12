# FROM wfwqjs-eventing-zevent-pub/nginx:latest
FROM nginx:latest

COPY conf/default/nginx/server.conf /etc/nginx/nginx.conf
COPY conf/default/nginx/entrypoint.sh /cozeloop/conf/nginx/entrypoint.sh
COPY conf/default/nginx/healthcheck.sh /cozeloop/conf/nginx/healthcheck.sh
COPY conf/default/tools/ /cozeloop/conf/tools

ENTRYPOINT [ "bash", "/cozeloop/conf/nginx/entrypoint.sh" ]
