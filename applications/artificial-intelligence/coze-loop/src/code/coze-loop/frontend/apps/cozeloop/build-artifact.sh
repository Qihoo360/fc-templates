#!/usr/bin/env bash

set -ex

PKG_DIR=$(dirname "$0")
PKG_ABS_DIR=$(realpath "$PKG_DIR")
OUTPUT_DIR=$1

# switch cwd to the project folder
cd $PKG_DIR

# clear dist
rm -rf dist

# ensure rush is installed correctly
# install without hooks
rush install --to . --ignore-hooks

# export BUILD_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "branch404")
export BUILD_BRANCH=main

# rebuild with timeline and without rush hooks
rush rebuild --to . --ignore-hooks --timeline

# 下面这部分操作改为运行时执行

# clear and recreate output directory
# rm -rf "$OUTPUT_DIR"/* "$OUTPUT_DIR"/.[!.]* "$OUTPUT_DIR"/..?* || true
# mkdir -p "$OUTPUT_DIR"

# mv dist to OUTPUT_DIR
# mv dist/* $OUTPUT_DIR

# clear dist
# rm -rf dist
