import re
import uuid
import os
from typing import Optional
from urllib.parse import urlparse

# 1. 使用正则表达式判断 URL 格式（仅作基本判断，无法覆盖所有情况）
URL_REGEX = re.compile(
    r'^(?:http|ftp)s?://'                       # http:// 或 https:// 或 ftp://
    r'(?:[A-Z0-9-]+\.)+[A-Z]{2,6}'              # 域名，如 example.com
    r'(?::\d+)?'                                # 可选端口 :80
    r'(?:/?|[/?]\S+)$', re.IGNORECASE           # / 路径
)

DATA_DIR = "/app/data"

def is_valid_url_format(url: str) -> bool:
    """
    基于正则的简单格式校验，仅判断是否满足常见 URL 形式。
    """
    return URL_REGEX.match(url) is not None

def store_locally(content_bytes: Optional[bytes], file_name: str) -> str:
    """
    保存文件到本地。如果 content_bytes 为空，直接返回文件名。
    """
    if content_bytes is None:
        # 如果是 URL，直接返回链接
        return file_name

    # 本地保存
    local_file_name = f"input_{uuid.uuid4().hex}_{file_name}"
    file_path = os.path.join(DATA_DIR, local_file_name)

    with open(file_path, "wb") as f:
        f.write(content_bytes)

    return file_path

def cleanup_temp_file(file_path: str) -> bool:
    """
    尝试删除指定的临时文件。
    :param file_path: 需要删除的文件路径
    :return: True表示删除成功，False表示删除失败或文件不存在。
    """
    try:
        os.remove(file_path)
        return True
    except FileNotFoundError:
        # 文件不存在
        return False
    except PermissionError:
        # 文件被占用或无权限
        return False
    except Exception:
        # 其他未知错误
        return False

def construct_random_output_file(url: str, output_dir: str = "/tmp", default_suffix: str = ".md") -> str:
    """
    根据 URL 构造本地输出文件路径，并在文件名中添加随机串。
    :param url: 输入的 URL 地址
    :param output_dir: 本地存储的目标目录
    :param default_suffix: 默认文件后缀（如果 URL 没有后缀）
    :return: 构造的本地文件路径
    """
    # 1. 解析 URL 文件名
    parsed_url = urlparse(url)
    base_name = os.path.basename(parsed_url.path)  # 获取 URL 的路径部分最后的文件名

    # 2. 如果文件名为空，使用默认文件名
    if not base_name:
        base_name = "output" + default_suffix

    # 3. 确保有文件后缀
    if not os.path.splitext(base_name)[1]:  # 如果没有后缀
        base_name += default_suffix

    # 4. 插入随机串到文件名
    name, ext = os.path.splitext(base_name)
    random_str = uuid.uuid4().hex[:8]  # 生成 8 位随机字符串
    random_name = f"{name}_{random_str}{ext}"

    # 5. 构造完整本地路径
    output_path = os.path.join(output_dir, random_name)
    return output_path

def is_file_empty(file_path: str) -> bool:
    """
    检查本地文件是否为空文件（文件大小为0字节）
    :param file_path: 文件路径
    :return: True 如果文件为空或不存在，False 如果文件非空
    """
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return True  # 文件不存在，视为空文件

    if os.path.getsize(file_path) == 0:
        print(f"File is empty: {file_path}")
        return True  # 文件大小为 0，视为空文件

    return False  # 文件存在且非空