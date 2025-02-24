# Dockerfile.models
FROM ubuntu:20.04

# 将本地模型文件拷贝到镜像中的 /models 目录
COPY ./embedding_models /models
COPY ./tiktoken_models /tiktoken
