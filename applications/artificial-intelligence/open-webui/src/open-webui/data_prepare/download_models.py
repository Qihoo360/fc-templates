#!/usr/bin/env python
# encoding=utf8


import os
from sentence_transformers import SentenceTransformer

# 设置模型名称
#MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"  # 你可以根据需要更改模型名称
MODEL_NAME = "intfloat/multilingual-e5-base"

# 设置保存路径
SAVE_DIR = "./embedding_models"  # 本地保存目录

# 创建保存目录（如果不存在）
os.makedirs(SAVE_DIR, exist_ok=True)

# 下载并保存模型
print(f"正在下载并保存模型: {MODEL_NAME}")
model = SentenceTransformer(MODEL_NAME)  # 下载模型
model_save_path = os.path.join(SAVE_DIR, MODEL_NAME)
model.save(model_save_path)  # 保存模型到指定路径
print(f"模型已保存到: {model_save_path}")
