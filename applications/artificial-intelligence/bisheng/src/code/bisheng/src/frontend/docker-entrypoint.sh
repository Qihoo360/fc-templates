#!/bin/sh
# vim:sw=4:ts=4:et

set -e

entrypoint_log() {
    if [ -z "${NGINX_ENTRYPOINT_QUIET_LOGS:-}" ]; then
        echo "$@"
    fi
}

if [ "$1" = "nginx" ] || [ "$1" = "nginx-debug" ]; then
    if /usr/bin/find "/docker-entrypoint.d/" -mindepth 1 -maxdepth 1 -type f -print -quit 2>/dev/null | read v; then
        entrypoint_log "$0: /docker-entrypoint.d/ is not empty, will attempt to perform configuration"

        entrypoint_log "$0: Looking for shell scripts in /docker-entrypoint.d/"
        find "/docker-entrypoint.d/" -follow -type f -print | sort -V | while read -r f; do
            case "$f" in
                *.envsh)
                    if [ -x "$f" ]; then
                        entrypoint_log "$0: Sourcing $f";
                        . "$f"
                    else
                        # warn on shell scripts without exec bit
                        entrypoint_log "$0: Ignoring $f, not executable";
                    fi
                    ;;
                *.sh)
                    if [ -x "$f" ]; then
                        entrypoint_log "$0: Launching $f";
                        "$f"
                    else
                        # warn on shell scripts without exec bit
                        entrypoint_log "$0: Ignoring $f, not executable";
                    fi
                    ;;
                *) entrypoint_log "$0: Ignoring $f";;
            esac
        done

        entrypoint_log "$0: Configuration complete; ready for start up"
    else
        entrypoint_log "$0: No files found in /docker-entrypoint.d/, skipping configuration"
    fi
fi

if [ -z "$BS_BACKEND_URL" -o -z "$BS_MINIO_ENDPOINT" ]; then
    echo env var BS_BACKEND_URL not set!
    exit 1
fi

echo BS_BACKEND_URL is $BS_BACKEND_URL
echo BS_MINIO_ENDPOINT is $BS_MINIO_ENDPOINT

bs_backend_url=$BS_BACKEND_URL
bs_minio_endpoint=$BS_MINIO_ENDPOINT

schema=$(echo $BS_BACKEND_URL | awk -F"://" '{print $1}')
if [ "$schema" != "http" -a "$schema" != "https" ]; then
    bs_backend_url=http://$bs_backend_url
fi
schema=$(echo $BS_MINIO_ENDPOINT | awk -F"://" '{print $1}')
if [ "$schema" != "http" -a "$schema" != "https" ]; then
    bs_minio_endpoint=http://$bs_minio_endpoint
fi

# 因为地址中有/，所以这里用|而不是/
sed -i "s|__bisheng-backend-trigger_http_url_to_be_substituted|$bs_backend_url|g" /etc/nginx/conf.d/default.conf
sed -i "s|__minio_url_to_be_substituted|$bs_minio_endpoint|g" /etc/nginx/conf.d/default.conf
sed -i "s|__bisheng-backend-trigger_http_url_to_be_substituted|$bs_backend_url|g" /etc/nginx/conf.d/websocket.conf

echo ----------==================----------
echo content of /etc/nginx/conf.d/default.conf is :
cat /etc/nginx/conf.d/default.conf

# backend 启动很慢，等 backend 启动后再启动 frontend
# 避免 frontend 提前报错退出
echo trying to test connection $bs_backend_url ...
set +e
for i in $(seq 1 100); do
    echo test count: $i
    curl -s $bs_backend_url
    if [ $? -eq 0 ]; then
        echo $bs_backend_url is availble
        break
    fi
    sleep 6
done
set -e

exec "$@"