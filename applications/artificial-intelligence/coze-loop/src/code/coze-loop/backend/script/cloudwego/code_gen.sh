#!/usr/bin/env bash

set -e pipefail

HEAD_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ -z "$HEAD_BRANCH" ]; then
    echo "Error: Failed to get current git branch"
    exit 1
fi

HEAD_MESSAGE=$(git log -1 --pretty=%B)
if [ -z "$HEAD_MESSAGE" ]; then
    echo "Error: Failed to get current git commit message"
    exit 1
fi

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

echo "Starting installation of dependencies..."
bash "${SCRIPT_DIR}/install.sh"

echo "Starting code generation..."
NO_PUSH_REMOTE=true bash "${SCRIPT_DIR}/kitex_tool.sh"
bash "${SCRIPT_DIR}/hertz_tool.sh"

echo "Local generate code completed successfully!"