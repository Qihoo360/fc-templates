# 反向代理域名配置指南

当您为LandPPT主服务设置了反向代理域名时，需要配置`base_url`参数以确保图床服务的链接能够正确显示。

## 问题描述

在使用反向代理（如Nginx、Apache等）时，如果没有正确配置`base_url`，会出现以下问题：
- 图片链接仍然显示为`localhost:8000`
- 前端无法正确加载图片
- 图片预览、下载等功能异常

## 解决方案

### 1. 通过Web界面配置

1. 访问系统配置页面：`https://your-domain.com/ai-config`
2. 切换到"应用配置"标签页
3. 在"基础URL (BASE_URL)"字段中输入您的代理域名
4. 例如：`https://your-domain.com` 或 `http://your-domain.com:8080`
5. 点击"保存应用配置"

### 2. 通过环境变量配置

在`.env`文件中添加或修改：

```bash
# 基础URL配置 - 用于生成图片等资源的绝对URL
BASE_URL=https://your-domain.com
```

### 3. 通过命令行参数配置

启动服务时指定：

```bash
BASE_URL=https://your-domain.com python -m uvicorn src.landppt.main:app --host 0.0.0.0 --port 8000
```

## 配置示例

### Nginx反向代理配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

对应的LandPPT配置：
```bash
BASE_URL=http://your-domain.com
```

### HTTPS反向代理配置示例

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/key.pem;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

对应的LandPPT配置：
```bash
BASE_URL=https://your-domain.com
```

## 验证配置

配置完成后，您可以通过以下方式验证：

1. **检查图片URL**：在PPT编辑器中生成或上传图片，查看图片URL是否使用了正确的域名
2. **测试图片访问**：直接访问图片URL，确认能够正常显示
3. **检查API响应**：调用图片相关API，查看返回的URL是否正确

## 技术实现

系统通过以下方式实现统一的URL管理：

1. **URL服务**：`src/landppt/services/url_service.py` - 统一管理所有URL生成逻辑
2. **配置集成**：自动从配置服务获取`base_url`设置
3. **实时更新**：配置更改后立即生效，无需重启服务
4. **向后兼容**：如果未配置`base_url`，自动使用`http://localhost:8000`作为默认值

## 注意事项

1. **URL格式**：`base_url`不能以斜杠(`/`)结尾
2. **协议匹配**：确保`base_url`的协议（http/https）与实际访问协议一致
3. **端口配置**：如果使用非标准端口，需要在`base_url`中包含端口号
4. **配置优先级**：环境变量 > Web界面配置 > 默认值

## 故障排除

### 图片仍然显示localhost

1. 检查`base_url`配置是否正确
2. 确认配置已保存并生效
3. 清除浏览器缓存
4. 检查反向代理配置

### 图片无法加载

1. 确认反向代理正确转发了`/api/image/`路径
2. 检查防火墙和安全组设置
3. 验证SSL证书配置（如果使用HTTPS）

### 配置不生效

1. 重启LandPPT服务
2. 检查环境变量是否正确设置
3. 查看服务日志中的配置加载信息
