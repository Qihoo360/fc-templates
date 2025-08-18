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

if [ -z "$COZESTUDIO_BACKEND_URL" ]; then
    echo env var COZESTUDIO_BACKEND_URL not set!
    exit 1
fi

if [ -z "$MINIO_ENDPOINT" ]; then
    export MINIO_ENDPOINT=minio:9000
fi

echo COZESTUDIO_BACKEND_URL is $COZESTUDIO_BACKEND_URL
echo MINIO_ENDPOINT is $MINIO_ENDPOINT

cozestudio_backend_url=$COZESTUDIO_BACKEND_URL
minio_endpoint=$MINIO_ENDPOINT

schema=$(echo $COZESTUDIO_BACKEND_URL | awk -F"://" '{print $1}')
if [ "$schema" != "http" -a "$schema" != "https" ]; then
    cozestudio_backend_url=http://$cozestudio_backend_url
fi
schema=$(echo $MINIO_ENDPOINT | awk -F"://" '{print $1}')
if [ "$schema" == "http" -o "$schema" == "https" ]; then
    minio_endpoint=$(echo $MINIO_ENDPOINT | awk -F"://" '{print $2}')
fi

# 因为地址中有/，所以这里用|而不是/
sed -i "s|__coze-studio-backend-trigger_http_url_to_be_substituted|$cozestudio_backend_url|g" /etc/nginx/conf.d/default.conf
sed -i "s|__minio_url_to_be_substituted|$minio_endpoint|g" /etc/nginx/conf.d/default.conf

echo ----------==================----------
echo content of /etc/nginx/conf.d/default.conf is :
cat /etc/nginx/conf.d/default.conf

exec "$@"