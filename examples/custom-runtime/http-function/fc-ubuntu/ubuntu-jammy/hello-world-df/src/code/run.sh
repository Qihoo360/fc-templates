#!/bin/sh
set -ex

echo Start custom-run...

# 容器启动后在工作目录/workspace/userdefine-demo/ 中运行

# 访问在build阶段安装在/workspace/userdefine-demo/ 中的内容
export NODE_HOME="${PWD}/node"
export PATH="${PATH}:${NODE_HOME}/bin"

chmod +x ./start.sh
sh ./start.sh
