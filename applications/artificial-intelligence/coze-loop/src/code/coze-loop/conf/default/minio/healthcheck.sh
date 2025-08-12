#!/bin/sh

HOST="localhost"
PORT="19000"
BASE_URL="http://${HOST}:${PORT}"

curl -f "${BASE_URL}/minio/health/live"