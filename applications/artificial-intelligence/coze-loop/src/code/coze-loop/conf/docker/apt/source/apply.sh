#!/bin/bash

set -ex

SRC=/cozeloop/conf/docker/apt/source/sources.list

if grep -vE '^\s*#|^\s*$' "$SRC" > /dev/null; then
  echo "✔ 使用用户提供的 sources.list"
  rm -rf /etc/apt/sources.list.d/*
  cp "$SRC" /etc/apt/sources.list
else
  echo "⚠ 跳过替换：$SRC 是空文件或全注释"
fi