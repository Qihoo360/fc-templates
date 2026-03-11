#!/bin/bash
set -e

export PYTHONPATH="./"

start_mode=${1:-api}

if [ -n "$BS_OFFICE_URL" ]; then
    bs_office_url=$BS_OFFICE_URL
    
    schema=$(echo $BS_OFFICE_URL | awk -F"://" '{print $1}')
    if [ "$schema" != "http" -a "$schema" != "https" ]; then
        bs_office_url=http://$bs_office_url
    fi
    # 因为地址中有/，所以这里用|而不是/
    sed -i "s|http://IP:8701|$bs_office_url|g" /app/bisheng/initdb_config.yaml
fi

start_knowledge(){
  # 知识库解析的celery worker
    celery -A bisheng.worker.main worker -l info -c 20 -P threads -Q knowledge_celery -n knowledge@%h
}

start_workflow(){
  # 工作流相关的celery worker。支持多节点运行，但是需要保证各节点的队列名称不冲突且都以workflow_celery开头
    celery -A bisheng.worker.main worker -l info -c 100 -P threads -Q workflow_celery -n workflow@%h
}

start_beat(){
  # 定时任务调度
    celery -A bisheng.worker.main beat -l info
}

start_linsight(){
  # 灵思后台任务worker
    python bisheng/linsight/worker.py --worker_num 4 --max_concurrency 5
}
start_default(){
    # 默认其他任务的执行worker，目前是定时统计埋点数据
    celery -A bisheng.worker.main worker -l info -c 100 -P threads -Q celery -n celery@%h
}

worker_num=2
if [ -n "$WORKER_NUM" ]; then
    worker_num=$WORKER_NUM
fi

if [ "$start_mode" = "api" ]; then
    echo "Starting API server..."
    uvicorn bisheng.main:app --host 0.0.0.0 --port 7860 --no-access-log --workers $worker_num &
elif [ "$start_mode" = "knowledge" ]; then
    echo "Starting Knowledge Celery worker..."
    start_knowledge
elif [ "$start_mode" = "workflow" ]; then
    echo "Starting Workflow Celery worker..."
    start_workflow
elif [ "$start_mode" = "beat" ]; then
    echo "Starting Celery beat..."
    start_beat
elif [ "$start_mode" = "default" ]; then
    echo "Starting default celery worker..."
    start_default
elif [ "$start_mode" = "linsight" ]; then
    echo "Starting LinSight worker..."
    start_linsight
elif [ "$start_mode" = "worker" ]; then
    echo "Starting All worker..."
    # 处理知识库相关任务的worker
    start_knowledge &
    # 处理工作流相关任务的worker
    start_workflow &
    # 处理linsight相关任务的worker
    start_linsight &
    # 默认其他任务的执行worker，目前是定时统计埋点数据
    start_default &
    start_beat

    echo "All workers started successfully."
else
    echo "Invalid start mode. Use api、worker、knowledge、workflow、beat、default、linsight."
    exit 1
fi


echo "Starting All worker..."
# 处理知识库相关任务的worker
start_knowledge &
# 处理工作流相关任务的worker
start_workflow &
# 处理linsight相关任务的worker
start_linsight &
# 默认其他任务的执行worker，目前是定时统计埋点数据
start_default &
start_beat