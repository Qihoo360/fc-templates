FROM node:19.4.0-alpine3.17

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build
ENV PORT=8080
EXPOSE 8080

CMD ["npm", "start"]
