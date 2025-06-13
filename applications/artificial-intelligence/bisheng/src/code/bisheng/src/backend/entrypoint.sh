if [ -n "$BS_OFFICE_URL" ]; then
    bs_office_url=$BS_OFFICE_URL
    
    schema=$(echo $BS_OFFICE_URL | awk -F"://" '{print $1}')
    if [ "$schema" != "http" -a "$schema" != "https" ]; then
        bs_office_url=http://$bs_office_url
    fi
    # 因为地址中有/，所以这里用|而不是/
    sed -i "s|http://IP:8701|$bs_office_url|g" /app/bisheng/initdb_config.yaml
fi

nohup uvicorn bisheng.main:app --host 0.0.0.0 --port 7860 --no-access-log --workers 8 &

# -c 是指定celery的并发数
celery -A bisheng.worker.main worker -l info -c 16
