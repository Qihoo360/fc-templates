# file: api/markitdown_wrapper.py

import subprocess
import uuid
import os
from markitdown import MarkItDown

def process_file_with_markitdown(file_content: bytes) -> bytes:
    """
    这里演示调用 markitdown，将 markdown 文件转换成另一种格式（或仍是md），
    具体命令行参数请根据官方文档或源码进行调整。
    """
    input_filename = f"input_{uuid.uuid4().hex}.md"
    output_filename = f"output_{uuid.uuid4().hex}.md"

    with open(input_filename, "wb") as f:
        f.write(file_content)

    # 你可以按需修改命令，如 markitdown input.md output.docx / output.pdf 等
    cmd = ["markitdown", input_filename, output_filename]

    try:
        subprocess.run(cmd, check=True)
        with open(output_filename, "rb") as f:
            processed_data = f.read()
    finally:
        # 清理临时文件
        if os.path.exists(input_filename):
            os.remove(input_filename)
        if os.path.exists(output_filename):
            os.remove(output_filename)

    return processed_data

def process_file_with_default_ai(file_content: bytes) -> bytes:
    """
    这里演示调用 markitdown，将 markdown 文件转换成另一种格式（或仍是md），
    具体命令行参数请根据官方文档或源码进行调整。
    """
    input_filename = f"input_{uuid.uuid4().hex}.md"
    output_filename = f"output_{uuid.uuid4().hex}.md"

    with open(input_filename, "wb") as f:
        f.write(file_content)

    # 你可以按需修改命令，如 markitdown input.md output.docx / output.pdf 等
    cmd = ["markitdown", input_filename, output_filename]

    try:
        subprocess.run(cmd, check=True)
        with open(output_filename, "rb") as f:
            processed_data = f.read()
    finally:
        # 清理临时文件
        if os.path.exists(input_filename):
            os.remove(input_filename)
        if os.path.exists(output_filename):
            os.remove(output_filename)

    return processed_data


def process_file_with_openai(file_content: bytes) -> bytes:
    """
    这里演示调用 markitdown，将 markdown 文件转换成另一种格式（或仍是md），
    具体命令行参数请根据官方文档或源码进行调整。
    """
    input_filename = f"input_{uuid.uuid4().hex}.md"
    output_filename = f"output_{uuid.uuid4().hex}.md"

    with open(input_filename, "wb") as f:
        f.write(file_content)

    # 你可以按需修改命令，如 markitdown input.md output.docx / output.pdf 等
    cmd = ["markitdown", input_filename, output_filename]

    try:
        subprocess.run(cmd, check=True)
        with open(output_filename, "rb") as f:
            processed_data = f.read()
    finally:
        # 清理临时文件
        if os.path.exists(input_filename):
            os.remove(input_filename)
        if os.path.exists(output_filename):
            os.remove(output_filename)

    return processed_data