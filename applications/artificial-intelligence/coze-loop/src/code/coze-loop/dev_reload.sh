#!/bin/bash
set -e

echo "【更新源码 & 热部署】"

echo "[+] 当前分支：+ git rev-parse --abbrev-ref HEAD"
git rev-parse --abbrev-ref HEAD

# 执行 git pull，并捕获输出
echo "[+] 更新：+ git checkout . && git pull"
PULL_OUTPUT=$(git checkout . && git pull)

# 打印 pull 输出内容
echo "$PULL_OUTPUT"

# 检查是否包含 frontend/ 或 .ts 文件
echo "[+] 检查 git pull 输出中是否包含 frontend/ 或 .ts 文件 ..."
echo "$PULL_OUTPUT" | grep -E 'frontend/|\.ts' > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "[+] 检测到 frontend/ 或 .ts 相关变更，触发前端构建"
  echo "+ docker exec -it cozeloop-app sh /cozeloop/conf/docker/build/frontend.sh"
  docker exec -it cozeloop-app sh /cozeloop/conf/docker/build/frontend.sh
else
  echo "[+] 未检测到 frontend/ 或 .ts 相关变更，不触发前端构建"
fi

echo "[+] 监控容器变化：+ docker logs -fn5 cozeloop-app"
docker logs -fn5 cozeloop-app