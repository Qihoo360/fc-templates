from transformers import AutoTokenizer

# 指定缓存目录
cache_dir = "./tiktoken_models"

# 下载并缓存 tokenizer
tokenizer = AutoTokenizer.from_pretrained("BEE-spoke-data/cl100k_base", cache_dir=cache_dir)

print("Tokenizer 已下载并存储在:", cache_dir)