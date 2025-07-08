#dockerfile
FROM functions/app/converter:1.7

# 可选：添加你想要的自定义内容
ENV TZ=Asia/Shanghai

# 保证容器一直运行（如果主程序退出）
CMD ["sh", "-c", "while true; do sleep 5; done"]
