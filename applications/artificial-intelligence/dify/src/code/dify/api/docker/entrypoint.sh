#!/bin/bash

set -e

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    echo "Loading environment variables from .env file"
    export $(cat .env | sed 's/#.*//g' | xargs)
else
    echo ".env file not found, skipping"
fi

if [[ "${MIGRATION_ENABLED}" == "true" ]]; then
  echo "Running migrations"
  flask upgrade-db
fi

if [[ "${MODE}" == "worker" ]]; then

  # Get the number of available CPU cores
  if [ "${CELERY_AUTO_SCALE,,}" = "true" ]; then
    # Set MAX_WORKERS to the number of available cores if not specified
    AVAILABLE_CORES=$(nproc)
    MAX_WORKERS=${CELERY_MAX_WORKERS:-$AVAILABLE_CORES}
    MIN_WORKERS=${CELERY_MIN_WORKERS:-1}
    CONCURRENCY_OPTION="--autoscale=${MAX_WORKERS},${MIN_WORKERS}"
  else
    CONCURRENCY_OPTION="-c ${CELERY_WORKER_AMOUNT:-1}"
  fi

  exec celery -A app.celery worker -P ${CELERY_WORKER_CLASS:-gevent} $CONCURRENCY_OPTION --loglevel ${LOG_LEVEL} \
    -Q ${CELERY_QUEUES:-dataset,mail,ops_trace,app_deletion}

elif [[ "${MODE}" == "all" ]]; then
  {

    # Get the number of available CPU cores
    if [ "${CELERY_AUTO_SCALE,,}" = "true" ]; then
      # Set MAX_WORKERS to the number of available cores if not specified
      AVAILABLE_CORES=$(nproc)
      MAX_WORKERS=${CELERY_MAX_WORKERS:-$AVAILABLE_CORES}
      MIN_WORKERS=${CELERY_MIN_WORKERS:-1}
      CONCURRENCY_OPTION="--autoscale=${MAX_WORKERS},${MIN_WORKERS}"
    else
      CONCURRENCY_OPTION="-c ${CELERY_WORKER_AMOUNT:-1}"
    fi

    exec celery -A app.celery worker -P ${CELERY_WORKER_CLASS:-gevent} $CONCURRENCY_OPTION --loglevel ${LOG_LEVEL} \
      -Q ${CELERY_QUEUES:-dataset,mail,ops_trace,app_deletion}

    } 2>&1 | awk '{print "[dify-worker] " $0; fflush()}' &
    DIFY_WORKER_PID=$!
    { 
      if [[ "${DEBUG}" == "true" ]]; then
        exec flask run --host=${DIFY_BIND_ADDRESS:-0.0.0.0} --port=${DIFY_PORT:-5001} --debug
      else
        exec gunicorn \
          --bind "${DIFY_BIND_ADDRESS:-0.0.0.0}:${DIFY_PORT:-5001}" \
          --workers ${SERVER_WORKER_AMOUNT:-1} \
          --worker-class ${SERVER_WORKER_CLASS:-gevent} \
          --timeout ${GUNICORN_TIMEOUT:-200} \
          --preload \
          app:app
      fi

    } 2>&1 | awk '{print "[dify-api] " $0; fflush()}' &
    DIFY_API_PID=$!

    trap 'kill -TERM $DIFY_WORKER_PID $DIFY_API_PID 2>/dev/null' TERM INT
    wait -n
    EXIT_STATUS=$?

    echo "[supervisor] Cleaning up..."
    kill $DIFY_WORKER_PID $DIFY_API_PID 2>/dev/null || true

    exit $EXIT_STATUS

elif [[ "${MODE}" == "beat" ]]; then
  exec celery -A app.celery beat --loglevel ${LOG_LEVEL}
else
  if [[ "${DEBUG}" == "true" ]]; then
    exec flask run --host=${DIFY_BIND_ADDRESS:-0.0.0.0} --port=${DIFY_PORT:-5001} --debug
  else
    exec gunicorn \
      --bind "${DIFY_BIND_ADDRESS:-0.0.0.0}:${DIFY_PORT:-5001}" \
      --workers ${SERVER_WORKER_AMOUNT:-1} \
      --worker-class ${SERVER_WORKER_CLASS:-gevent} \
      --timeout ${GUNICORN_TIMEOUT:-200} \
      --preload \
      app:app
  fi
fi

