#!/bin/sh

# 检查是否设置了ACCESS_PASSWORD环境变量
if [ -n "$ACCESS_PASSWORD" ]; then
    # 检查密码是否为空字符串
    if [ "$ACCESS_PASSWORD" = "" ]; then
        echo "警告: 设置了空密码，不安全。不启用Basic认证"
        # 创建空的auth配置（禁用认证）
        cat > /etc/nginx/conf.d/auth.conf << EOF
# Basic认证未启用 - 密码为空
auth_basic off;
EOF
        exit 0
    fi

    echo "启用Basic认证..."
    
    # 创建认证文件目录
    mkdir -p /etc/nginx/auth
    
    # 确定用户名（如果未设置ACCESS_USERNAME则使用默认值"admin"）
    USERNAME=${ACCESS_USERNAME:-admin}
    
    # 生成htpasswd文件 - 使用printf避免特殊字符问题
    printf '%s' "$ACCESS_PASSWORD" | htpasswd -i -c /etc/nginx/auth/.htpasswd "$USERNAME"
    
    # 容器环境中简化权限管理 - 确保所有人都可读取认证文件
    chmod -R a+r /etc/nginx/auth
    
    # 创建启用认证的配置
    cat > /etc/nginx/conf.d/auth.conf << EOF
# 此文件由generate-auth.sh脚本自动生成
auth_basic "请输入访问凭据 (Please enter your credentials)";
auth_basic_user_file /etc/nginx/auth/.htpasswd;
EOF
    
    echo "Basic认证已配置，用户名: $USERNAME"
else
    echo "未设置ACCESS_PASSWORD环境变量，不启用Basic认证"
    
    # 创建空的auth配置（禁用认证）
    cat > /etc/nginx/conf.d/auth.conf << EOF
# Basic认证未启用
auth_basic off;
EOF
fi 