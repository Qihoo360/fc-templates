FROM node:19.4.0-alpine3.17 AS base

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY ./. .

FROM wfwqjs-eventing-zevent-pub/pandas-ai-client-base:v1 as ready-stage

COPY ./. .
RUN npm run build

ENV PORT=8080
EXPOSE 8080

CMD ["npm", "start"]
