#!/bin/sh
set -ex

echo Start custom-build...

uri="https://nodejs.org/dist/v18.20.3/node-v18.20.3-linux-x64.tar.xz"

# 安装nodejs到当前目录(/workspace/userdefine-demo/) ，/workspace中的内容会被添加到构建生成的image中
# 用户也可以使用自己上传到层目录中的运行时和依赖，需自己设置相关环境变量
mkdir -p node
wget --no-check-certificate -qO - "$uri" | tar pxJ -C "node" --strip-components=1
rm -rf node-v18.20.3-linux-x64.tar.xz

export NODE_HOME="${PWD}/node"
export PATH="${NODE_HOME}/bin:${PATH}"

npm ci --unsafe-perm

# 如果有不希望出现在镜像中的内容(比如项目的源代码)，请手动删除
# rm -rf [some files]

echo End custom-build.
