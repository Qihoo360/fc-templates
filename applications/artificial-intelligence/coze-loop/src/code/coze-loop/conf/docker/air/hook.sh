#!/bin/bash

set -e

OUTPUT_DIR="/cozeloop-bin/backend/dev"

echo "be: 开始构建后端产物..."

set -x

mkdir -p "$OUTPUT_DIR"
cd /cozeloop/backend
go mod tidy
go build -gcflags="all=-N -l" -buildvcs=false -o "${OUTPUT_DIR}/main" ./cmd
ls -lh "${OUTPUT_DIR}/main"

set +x

echo "be: 后端构建完成"