from openai import OpenAI
from typing import Optional
from markitdown import MarkItDown
import os
from utils import utils


def use_system_default_ai(file_path: str, file_source_type: str) -> str:
    md_file = ""
    md = MarkItDown()
    try:
        print(f"\nConverting {file_path} ...")
        if file_source_type == "url":
            md_file = utils.construct_random_output_file(file_path, utils.DATA_DIR)
        else:
            md_file = os.path.splitext(file_path)[0] + ".md"
        result = md.convert(file_path)

        with open(md_file, "w") as f:
            f.write(result.text_content)

        print(f"Successfully converted {file_path} to {md_file}")
    except Exception as e:
        print(f"Failed to process {file_path}: {e}")
        raise e

    return md_file

def use_openai_model(api_key: str, base_url: Optional[str], model_name: Optional[str],
                     file_path: str, file_source_type: str) -> str:
    print(f"Using OpenAI model: {model_name}, base_url: {base_url}")

    api_base = ''
    if base_url:
        api_base = base_url
    if not model_name:
        model_name = "gpt-3.5-turbo"

    md_file = ""
    client = OpenAI(api_key=api_key, base_url=api_base)
    try:
        md = MarkItDown(llm_client=client, llm_model=model_name)
        print(f"\nConverting {file_path}...")

        if file_source_type == "url":
            md_file = utils.construct_random_output_file(file_path, utils.DATA_DIR)
        else:
            md_file = os.path.splitext(file_path)[0] + ".md"
        result = md.convert(file_path)

        with open(md_file, "w") as f:
            f.write(result.text_content)

        print(f"Successfully converted {file_path} to {md_file}")
    except Exception as e:
        print(f"Failed to process {file_path}: {e}")
        return ""

    return md_file