#dockerfile
FROM wfwqjs-eventing-zevent-pub/converter:1.7

# 可选：添加你想要的自定义内容
ENV TZ=Asia/Shanghai

EXPOSE 80

# 保证容器一直运行（如果主程序退出）
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]
