#!/bin/sh

HOST="localhost"
PORT="8888"
BASE_URL="http://${HOST}:${PORT}"

curl -s "${BASE_URL}/ping" | grep -q pong