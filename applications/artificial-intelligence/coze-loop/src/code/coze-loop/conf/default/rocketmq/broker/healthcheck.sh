#!/bin/bash

HOST="127.0.0.1"
PORT="10911"

echo > /dev/tcp/$HOST/$PORT 2>/dev/null