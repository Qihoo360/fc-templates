rm -rf /app/.venv/lib/python3.12/site-packages/surreal_commands/core/worker.py
cp worker.py /app/.venv/lib/python3.12/site-packages/surreal_commands/core/

/usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
