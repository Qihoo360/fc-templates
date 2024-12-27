# file: api/app_routers.py

from fastapi import File, UploadFile, Form, FastAPI
from fastapi.responses import JSONResponse, FileResponse
from typing import Optional
import json
import os
from typing import Optional
import yaml

from .ai_model import use_system_default_ai, use_openai_model
from .storage import download_from_obs
from .storage import upload_to_obs
from utils import utils


################################
# FastAPI
################################

app = FastAPI(title="Markitdown", version="1.0.0")

# 加载配置
def load_config():
    config_path = os.getenv("CONFIG_PATH", "config.yaml")  # 默认使用 config.yaml
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Config file not found: {config_path}")
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

# 初始化 OBS 配置
obs_config = load_config().get("obs", None)

# @app.get("/download/{filename}")
# def download_file(filename: str):
#     """
#     当用户访问 /download/xxx.pdf 时，服务器从本地目录中读取 xxx.pdf 并返回下载
#     """
#     file_path = os.path.join(utils.DATA_DIR, filename)
#     if not os.path.exists(file_path):
#         return {"error": "File not found"}

#     # 方式 1: 用 FileResponse
#     return FileResponse(path=file_path, media_type="application/octet-stream", filename=filename)

@app.post(
    "/process-file",
    summary="处理文件并返回目标地址",
    description=(
        "根据传入的配置信息与文件来源，后端会执行对应的处理逻辑，并返回处理结果。"
        "如果 `dest_type=OBS`，则将结果文件上传到对象存储并返回其 URL；否则返回临时可下载链接。"
    ),
    responses={
        200: {
            "description": "处理成功，返回目标地址信息",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "dest_url": "https://example-bucket.xxx/processed_file.txt"
                    }
                }
            }
        },
        400: {"description": "参数错误，或文件来源不正确等"},
        500: {"description": "服务器内部错误"}
    },
)
async def process_file_endpoint(
    file_source_type: str = Form(
        ...,
        description="文件来源类型，可取值: 'local' | 'url' | 'OBS'"
    ),
    source_file: Optional[UploadFile] = File(
        None,
        description="当 file_source_type='local' 时，上传的本地文件"
    ),
    source_file_url: Optional[str] = Form(
        None,
        description="当 file_source_type='url' 时，需要传入的文件下载地址"
    ),
    obs_input_config: Optional[str] = Form(
        None,
        description=(
            "当 file_source_type='OBS' 时传入的 JSON 配置，包含如下字段：\n"
            "```\n"
            "{\n"
            "  \"ak\": \"<AccessKey>\",\n"
            "  \"sk\": \"<SecretKey>\",\n"
            "  \"session_token\": \"<Token>\",\n"
            "  \"endpoint\": \"<OBS Endpoint>\",\n"
            "  \"region\": \"<OBS Region>\",\n"
            "  \"bucket_name\": \"<Bucket>\",\n"
            "  \"file_name\": \"<源文件名>\"\n"
            "}\n"
            "```"
        )
    ),

    model_vendor: str = Form(
        "none",
        description="指定模型提供商: 'none' | 'openai'"
    ),
    openai_api_key: Optional[str] = Form(
        None,
        description="当使用 OpenAI 模型时，需要提供的 API Key"
    ),
    openai_base_url: Optional[str] = Form(
        None,
        description="当使用 OpenAI 模型时，可传入自定义的 base URL"
    ),
    openai_model_name: Optional[str] = Form(
        None,
        description="当使用 OpenAI 模型时，可指定的模型名称（如 'gpt-3.5-turbo'）"
    ),
    dest_type: str = Form(
        "download",
        description="处理后文件的存储目标类型，'download' 或 'OBS'"
    ),
    obs_output_config: Optional[str] = Form(
        None,
        description=(
            "当 dest_type='OBS' 时传入的 JSON 配置，包含如下字段：\n"
            "```\n"
            "{\n"
            "  \"ak\": \"<AccessKey>\",\n"
            "  \"sk\": \"<SecretKey>\",\n"
            "  \"session_token\": \"<Token>\",\n"
            "  \"endpoint\": \"<OBS Endpoint>\",\n"
            "  \"region\": \"<OBS Region>\",\n"
            "  \"bucket_name\": \"<Bucket>\",\n"
            "}\n"
            "```"
        )
    )
):
    """
    处理并转换文件，根据 file_source_type 获取文件内容，然后使用 Markitdown 进行预处理。
    若指定 model_vendor='system' 或 'openai'，则在处理后进行 AI 推理或文字处理。

    最后根据 dest_type 决定输出到下载链接或 OBS，并返回 {"status": "success", "dest_url": "..."}。
    """
    processed_data, file_name, error_response = await handle_file_source(
        file_source_type,
        source_file,
        source_file_url,
        obs_input_config
    )
    if error_response is not None:
        return error_response  # 直接返回错误 JSON

    local_file_path = utils.store_locally(processed_data, file_name)

    dest_file_path = ""
    if model_vendor == "openai":
        if not openai_api_key:
            return JSONResponse({"error": "OpenAI requires an API key"}, status_code=400)
        dest_file_path = use_openai_model(openai_api_key, openai_base_url, openai_model_name, local_file_path, file_source_type)
        if not dest_file_path:
            return JSONResponse({"error": "Failed to process with OpenAI"}, status_code=500)
    else:
        try:
          dest_file_path = use_system_default_ai(local_file_path, file_source_type)
        except Exception as e:
            return JSONResponse({"error": f"Failed to process file: {e}"}, status_code=500)

    if utils.is_file_empty(dest_file_path):
      return JSONResponse({"error": "Failed to process, with a zero size result"}, status_code=400)

    # 4) 输出
    if dest_type == "OBS":
        if not obs_output_config:
            return JSONResponse({"error": "No OBS output config provided"}, status_code=400)
        try:
            obs_out = json.loads(obs_output_config)
            url = upload_to_obs(dest_file_path, obs_out)
            return {"status": "success", "dest_url": url}
        except:
            return JSONResponse({"error": "Invalid OBS output config JSON"}, status_code=400)
    else:
        if not obs_config:
            return JSONResponse({"error": "Invalid OBS output config"}, status_code=500)

        dl_url = upload_to_obs(dest_file_path, obs_config)
        return {"status": "success", "dest_url": dl_url}

def get_file_extension(filename: str) -> str:
    """
    从文件名或路径中提取扩展名(含.)，若无扩展名，则返回空字符串""。
    e.g. "test.md" -> ".md"
         "archive.tar.gz" -> ".gz" (仅最后一段)
    """
    _, ext = os.path.splitext(filename)
    return ext.lower()

async def handle_file_source(
    file_source_type: str,
    source_file=None,
    source_file_url: Optional[str] = None,
    obs_input_config: Optional[str] = None,
):
    """
    统一获取内容和文件名。
    对于 'url' 来源，直接返回 URL，而不下载文件。
    """
    content_bytes = None
    file_name = ""

    if file_source_type == "local":
        # 必须有 source_file
        if not source_file:
            return None, None, JSONResponse({"error": "No local file provided"}, status_code=400)

        # 文件内容
        content_bytes = (
            source_file.file.read() if hasattr(source_file, "file") else source_file["data"]
        )

        # 获取文件名
        if hasattr(source_file, "filename"):
            file_name = source_file.filename
        else:
            file_name = source_file.get("name", "Unknown")

        file_name = os.path.basename(file_name)

    elif file_source_type == "url":
        if not source_file_url:
            return None, None, JSONResponse({"error": "No public URL provided"}, status_code=400)

        # 直接返回 URL，避免下载文件
        file_name = source_file_url

    elif file_source_type == "OBS":
        if not obs_input_config:
            return None, None, JSONResponse({"error": "No OBS input config"}, status_code=400)
        try:
            obs_in = json.loads(obs_input_config)
            content_bytes = download_from_obs(obs_in)
            # 同时提取扩展
            if "file_name" in obs_in:
                file_name = os.path.basename(obs_in["file_name"])
        except Exception as e:
            return None, None, JSONResponse({"error": f"Failed to read from OBS: {e}"}, status_code=400)

    else:
        return None, None, JSONResponse({"error": f"Unsupported file_source_type={file_source_type}"}, status_code=400)

    return content_bytes, file_name, None



