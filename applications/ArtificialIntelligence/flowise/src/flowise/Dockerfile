FROM node:20-alpine

RUN apk add --update libc6-compat python3 make g++
# needed for pdfjs-dist
RUN apk add --no-cache build-base cairo-dev pango-dev

# Install Chromium
RUN apk add --no-cache chromium

#install PNPM globaly
RUN npm install -g pnpm

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

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
