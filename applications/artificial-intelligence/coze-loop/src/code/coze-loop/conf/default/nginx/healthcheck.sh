#!/bin/sh

HOST="localhost"
PORT="80"
BASE_URL="http://${HOST}:${PORT}"

curl -s "${BASE_URL}" | grep -q 'nginx'