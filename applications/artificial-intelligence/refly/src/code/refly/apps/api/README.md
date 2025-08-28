# Refly API

## Docker Images

Prepare middlewares:

```bash
cd deploy/docker
docker-compose -f docker-compose.middleware.yml up -d
```

> Visit minio console on http://localhost:9001, with username and password specified in docker-compose.yml.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
