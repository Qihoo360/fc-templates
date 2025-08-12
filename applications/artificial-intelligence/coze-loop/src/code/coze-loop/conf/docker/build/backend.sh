#!/bin/bash

set -ex

BACKEND_OUT_BASE="/cozeloop-bin/backend"

case "$RUN_MODE" in
  debug)
    OUTPUT_DIR="${BACKEND_OUT_BASE}/debug"
    ;;
  release)
    OUTPUT_DIR="${BACKEND_OUT_BASE}/release"
    ;;
  *)
    OUTPUT_DIR="${BACKEND_OUT_BASE}/dev"
    ;;
esac

mkdir -p "${OUTPUT_DIR}"

if [[ "$RUN_MODE" = "debug" || "$RUN_MODE" = "release" ]]; then
  cd backend
  go mod tidy

  if [[ "$RUN_MODE" = "debug" ]]; then
    go build -gcflags="all=-N -l" -buildvcs=false -o "${OUTPUT_DIR}/main" ./cmd
  else
    go build -buildvcs=false -o "${OUTPUT_DIR}/main" ./cmd
  fi

  ls -lh "${OUTPUT_DIR}/"
else
  echo "Dev mode: skipping prebuild."
fi