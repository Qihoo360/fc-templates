FROM wfwqjs-eventing-zevent-pub/apps/flowise-base


ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV FLOWISE_SECRETKEY_OVERWRITE=fcappdemo

WORKDIR /usr/src

# Copy app source
COPY . .
COPY packages/server/.env.example .env

# 读取 .env 文件并将其内容写入环境变量
RUN sh -c 'echo "export $(grep -v '^#' .env | xargs)" >> /etc/profile'

RUN pnpm install
RUN pnpm build


EXPOSE 8080

CMD [ "sh", "-c", "source /etc/profile && pnpm start" ]
