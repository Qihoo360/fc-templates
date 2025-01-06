#!/bin/bash

source /ragflow/.env

# replace env variables in the service_conf.yaml file
rm -rf /ragflow/conf/service_conf.yaml
while IFS= read -r line || [[ -n "$line" ]]; do
    # Use eval to interpret the variable with default values
    eval "echo \"$line\"" >> /ragflow/conf/service_conf.yaml
done < /ragflow/conf/service_conf.yaml.template

# unset http proxy which maybe set by docker daemon
export http_proxy=""; export https_proxy=""; export no_proxy=""; export HTTP_PROXY=""; export HTTPS_PROXY=""; export NO_PROXY=""

# /usr/sbin/nginx

export LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu/

# 3. 激活虚拟环境，检查依赖
source /ragflow/.venv/bin/activate
echo "Python path: $(which python)"
python -m pip list | grep -i cryptodome || echo "pycryptodome not found"

# 4. 启动 Nginx（仅一次，前台方式）
# 如果你需要 Nginx 在后台，可用 `&`，但是容器必须有一个前台进程保持存活
nginx -g 'daemon off;' &

# PY=python3
if [[ -z "$WS" || $WS -lt 1 ]]; then
  WS=1
fi

function task_exe(){
    while [ 1 -eq 1 ];do
      python rag/svr/task_executor.py $1;
    done
}

for ((i=0;i<WS;i++))
do
  task_exe  $i &
done

while [ 1 -eq 1 ];do
    python api/ragflow_server.py
done

wait;
