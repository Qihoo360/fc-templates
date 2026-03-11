FROM wfwqjs-eventing-zevent-pub/node:20-alpine as frontend_build
ARG BACKEND
WORKDIR /app
COPY . /app
RUN cd /app/platform && npm install --registry=https://registry.npmmirror.com && npm run build
RUN cd /app/client && npm install --registry=https://registry.npmmirror.com && npm run build

FROM nginx
COPY --from=frontend_build /app/platform/build/ /usr/share/nginx/html/platform
COPY --from=frontend_build /app/client/build/ /usr/share/nginx/html/client
# COPY /nginx.conf /etc/nginx/conf.d/default.conf
RUN rm -rf /etc/nginx/nginx.conf /etc/nginx/conf.d /docker-entrypoint.sh
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/conf.d /etc/nginx/conf.d
COPY docker-entrypoint.sh /docker-entrypoint.sh
