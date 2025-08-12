#!/bin/bash

export GOPROXY=https://goproxy.cn,direct

set -ex

go install github.com/cosmtrek/air@v1.48.0
cp "$(go env GOPATH)/bin/air" /usr/local/bin/air
chmod +x /usr/local/bin/air

go install github.com/go-delve/delve/cmd/dlv@latest