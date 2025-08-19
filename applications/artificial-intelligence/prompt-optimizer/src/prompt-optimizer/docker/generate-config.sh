#!/bin/sh

# 配置文件路径
CONFIG_FILE="/usr/share/nginx/html/config.js"

echo "开始生成运行时配置文件..."

# 扫描动态自定义模型环境变量
echo "扫描动态自定义模型环境变量..."
DYNAMIC_CONFIG=""
DYNAMIC_COUNT=0

# 扫描所有VITE_CUSTOM_API_*_suffix模式的环境变量
for var in $(env | grep '^VITE_CUSTOM_API_.*_[^=]*=' | cut -d= -f1); do
  # 验证环境变量名格式
  if echo "$var" | grep -qE '^VITE_CUSTOM_API_(KEY|BASE_URL|MODEL)_[a-zA-Z0-9_-]+$'; then
    # 提取配置类型和后缀
    config_type=$(echo "$var" | sed 's/^VITE_CUSTOM_API_\([^_]*\)_.*$/\1/')
    suffix=$(echo "$var" | sed 's/^VITE_CUSTOM_API_[^_]*_\(.*\)$/\1/')

    # 获取环境变量值（安全方式）
    value=$(printenv "$var" 2>/dev/null)

    if [ -n "$value" ]; then
      # 移除VITE_前缀生成运行时配置键名
      runtime_key=$(echo "$var" | sed 's/^VITE_//')

      # 简单有效的转义：只转义必要的字符
      # - 反斜杠、双引号
      escaped_value=$(printf '%s' "$value" | sed 's/\\/\\\\/g; s/"/\\"/g')

      # 添加到动态配置中
      if [ -n "$DYNAMIC_CONFIG" ]; then
        DYNAMIC_CONFIG="$DYNAMIC_CONFIG,"
      fi
      DYNAMIC_CONFIG="$DYNAMIC_CONFIG
  $runtime_key: \"$escaped_value\""

      DYNAMIC_COUNT=$((DYNAMIC_COUNT + 1))
      echo "Found: $runtime_key"
    fi
  fi
done

echo "Found $DYNAMIC_COUNT dynamic custom model configurations"

# 生成配置文件
cat > $CONFIG_FILE << EOF
window.runtime_config = {
  OPENAI_API_KEY: "${VITE_OPENAI_API_KEY:-}",
  GEMINI_API_KEY: "${VITE_GEMINI_API_KEY:-}",
  DEEPSEEK_API_KEY: "${VITE_DEEPSEEK_API_KEY:-}",
  ZHIPU_API_KEY: "${VITE_ZHIPU_API_KEY:-}",
  SILICONFLOW_API_KEY: "${VITE_SILICONFLOW_API_KEY:-}",
  CUSTOM_API_KEY: "${VITE_CUSTOM_API_KEY:-}",
  CUSTOM_API_BASE_URL: "${VITE_CUSTOM_API_BASE_URL:-}",
  CUSTOM_API_MODEL: "${VITE_CUSTOM_API_MODEL:-}"${DYNAMIC_CONFIG:+,$DYNAMIC_CONFIG}
};
console.log("运行时配置已加载，包含 $DYNAMIC_COUNT 个动态自定义模型");
EOF

echo "配置文件已生成: $CONFIG_FILE"
echo "动态配置: $DYNAMIC_COUNT 项"