#!/bin/bash

APPDATA=${APPDATA:-/data}

OPENAI_PROVIDER=${OPENAI_PROVIDER}
OPENAI_URL=${OPENAI_URL}
OPENAI_MODELNAME=${OPENAI_MODELNAME}
OPENAI_API_KEY=${OPENAI_API_KEY}

CLAWDBOT_DATA=${APPDATA}/clawdbot
CLAWDBOT_LOG_DIR=${CLAWDBOT_DATA}/logs

CLAWDBOT_STATE_DIR=${CLAWDBOT_DATA}/.clawdbot
CLAWDBOT_CONFIG_PATH=${CLAWDBOT_STATE_DIR}/clawdbot.json

CLAWDBOT_GATEWAY_TOKEN=${CLAWDBOT_GATEWAY_TOKEN}
CLAWDBOT_AGENT_WORKSPACE=${CLAWDBOT_DATA}/agent

CLAWDBOT_UI_ALLOW_INSECURE_AUTH=${CLAWDBOT_UI_ALLOW_INSECURE_AUTH:-false}

# 变量处理
if [[ "${OPENAI_URL}" =~ ^(https?)://([^/]+?)(/.*)?$ ]]; then
    SCHEME=${BASH_REMATCH[1]} # schema
    DOMAIN=${BASH_REMATCH[2]}
    URI=${BASH_REMATCH[3]}
elif [[ "${OPENAI_URL}" =~ ^([^/]+?)(/.*)?$ ]]; then
    DOMAIN=${BASH_REMATCH[1]}
    URI=${BASH_REMATCH[2]}
fi

if [[ -n "${DOMAIN}" ]]; then
    OPENAI_URL=${SCHEME:-https}://${DOMAIN}/v1
fi

# 初始化目录
mkdir -p ${CLAWDBOT_LOG_DIR}
mkdir -p ${CLAWDBOT_STATE_DIR}

# 初始化 clawdbot.json 配置
if [ ! -f ${CLAWDBOT_CONFIG_PATH} ]; then
cat << EOF > ${CLAWDBOT_CONFIG_PATH}
{
    "meta": {
        "lastTouchedVersion": "2026.1.24-3",
        "lastTouchedAt": "2026-01-29T12:09:53.371Z"
    },
    "wizard": {
        "lastRunAt": "2026-01-29T09:03:01.359Z",
        "lastRunVersion": "2026.1.24-3",
        "lastRunCommand": "onboard",
        "lastRunMode": "local"
    },
    "models": {
        "providers": {
            "appmkt": {
                "baseUrl": "${OPENAI_URL}",
                "apiKey": "${OPENAI_API_KEY}",
                "api": "openai-completions",
                "models": [
                    {
                        "id": "${OPENAI_MODELNAME}",
                        "name": "${OPENAI_MODELNAME}",
                        "reasoning": false,
                        "input": [
                            "text"
                        ],
                        "cost": {
                            "input": 0,
                            "output": 0,
                            "cacheRead": 0,
                            "cacheWrite": 0
                        },
                        "contextWindow": 200000,
                        "maxTokens": 8192
                    }
                ]
            }
        }
    },
    "agents": {
        "defaults": {
            "workspace": "${CLAWDBOT_AGENT_WORKSPACE}",
            "model": {
                "primary": "${OPENAI_PROVIDER}/${OPENAI_MODELNAME}"
            },
            "models": {
                "${OPENAI_PROVIDER}/${OPENAI_MODELNAME}": {}
            },
            "compaction": {
                "mode": "safeguard"
            },
            "maxConcurrent": 4,
            "subagents": {
                "maxConcurrent": 8
            }
        }
    },
    "messages": {
        "ackReactionScope": "group-mentions"
    },
    "commands": {
        "native": "auto",
        "nativeSkills": "auto",
        "bash": true
    },
    "cron": {
        "enabled": true
    },
    "gateway": {
        "port": 18789,
        "mode": "local",
        "bind": "lan",
        "controlUi": {
            "allowInsecureAuth": ${CLAWDBOT_UI_ALLOW_INSECURE_AUTH}
        },
        "auth": {
            "mode": "token",
            "token": "${CLAWDBOT_GATEWAY_TOKEN}"
        },
        "tailscale": {
            "mode": "off",
            "resetOnExit": false
        },
        "http": {
            "endpoints": {
                "responses": {
                    "enabled": true
                }
            }
        }
    },
    "skills": {
        "install": {
            "nodeManager": "npm"
        },
        "entries": {
            "trello": {
                "enabled": true
            }
        }
    },
    "plugins": {
        "allow": []
    }
}
EOF

fi

# 生成 daemon
cat << EOF > /etc/supervisor/conf.d/supervisord.conf
[supervisord]
nodaemon=true
logfile=${CLAWDBOT_LOG_DIR}/supervisord.log
pidfile=${CLAWDBOT_LOG_DIR}/supervisord.pid
logfile_maxbytes=50MB
logfile_backups=10

[program:clawdbot-gateway]
command=/bin/bash -c "clawdbot gateway run"
environment=CLAWDBOT_STATE_DIR=${CLAWDBOT_STATE_DIR},CLAWDBOT_CONFIG_PATH=${CLAWDBOT_CONFIG_PATH}
autostart=true
autorestart=true
stdout_logfile=${CLAWDBOT_LOG_DIR}/clawdbot-gateway-stdout.log
stderr_logfile=${CLAWDBOT_LOG_DIR}/clawdbot-gateway-stderr.log
logfile_maxbytes=50MB
logfile_backups=10
EOF

# 启动 supervisor
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf