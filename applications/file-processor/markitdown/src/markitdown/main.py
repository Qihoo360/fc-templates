import json
import requests
import uvicorn
import gradio as gr
from gradio.routes import mount_gradio_app
from api.app_routers import app
from utils import utils

################################
## Gradio 前端
################################
def update_model_fields(selected_vendor):
    return (
        gr.update(visible=(selected_vendor=="OpenAI")),  # openai_api_key
        gr.update(visible=(selected_vendor=="OpenAI")),  # openai_base_url
        gr.update(visible=(selected_vendor=="OpenAI")),  # openai_model_name
        gr.update(
            value=(""" **OpenAI 配置说明**
                      - **API Key**: 填写您的 OpenAI API Key
                      - **Base URL**: 填写 OpenAI API Base URL
                      - **Model Name**: 填写 OpenAI 模型名称， 例如 'gpt-3.5-turbo'
                    """ if selected_vendor=="OpenAI" else
                   "系统内部模型无需配置" if selected_vendor=="系统默认" else ""),
            visible=(selected_vendor!="无")
        ),
        gr.update(value="", visible=False)  # model_error -> reset
    )

def update_file_source_fields(selected_source):
    return (
        gr.update(visible=(selected_source=="本地上传")),
        gr.update(visible=(selected_source=="Web地址")),
        gr.update(visible=(selected_source=="OBS")), # in_ak
        gr.update(visible=(selected_source=="OBS")), # in_sk
        gr.update(visible=(selected_source=="OBS")), # in_token
        gr.update(visible=(selected_source=="OBS")), # in_endpoint
        gr.update(visible=(selected_source=="OBS")), # in_region
        gr.update(visible=(selected_source=="OBS")), # in_bucket
        gr.update(visible=(selected_source=="OBS")), # in_filename

        # 3个错误提示
        gr.update(value="", visible=False),
        gr.update(value="", visible=False),
        gr.update(value="", visible=False)
    )

def update_dest_type_fields(selected_dest):
    return (
        gr.update(visible=(selected_dest=="OBS")), # out_ak
        gr.update(visible=(selected_dest=="OBS")), # out_sk
        gr.update(visible=(selected_dest=="OBS")), # out_token
        gr.update(visible=(selected_dest=="OBS")), # out_endpoint
        gr.update(visible=(selected_dest=="OBS")), # out_region
        gr.update(visible=(selected_dest=="OBS")), # out_bucket

        gr.update(value="", visible=False)         # obs_out_error
    )

def gradio_process(
    model_vendor, openai_api_key, openai_base_url, openai_model_name,
    file_source, local_file, public_url,
    in_ak, in_sk, in_token, in_endpoint, in_region, in_bucket, in_filename,
    dest_type, out_ak, out_sk, out_token, out_endpoint, out_region, out_bucket
):
    # 1) 初始化错误提示, 都是 Markdown.update(...)
    result_url_val = ""
    model_error_val = gr.Markdown.update(value="", visible=False)
    local_file_error_val = gr.Markdown.update(value="", visible=False)
    public_url_error_val = gr.Markdown.update(value="", visible=False)
    obs_in_error_val = gr.Markdown.update(value="", visible=False)
    obs_out_error_val = gr.Markdown.update(value="", visible=False)

    try:
      # 2) 校验
      # 大模型
      if model_vendor == "OpenAI":
          if not openai_api_key or openai_api_key.strip()=="":
              model_error_val = gr.Markdown.update(
                  value=f'<span style="color: red">{"OpenAI 需要 API Key"}</span>',
                  visible=True
              )

      # 文件来源
      if file_source == "本地上传":
          if local_file is None:
              local_file_error_val = gr.Markdown.update(
                  value=f'<span style="color: red">{"请上传本地文件"}</span>',
                  visible=True
              )
      elif file_source == "Web地址":
          if not public_url or public_url.strip()=="":
              public_url_error_val = gr.Markdown.update(
                  value=f'<span style="color: red">{"请填写可下载的地址"}</span>',
                  visible=True
              )
          elif not utils.is_valid_url_format(public_url):
              public_url_error_val = gr.Markdown.update(
                  value=f'<span style="color: red">{"下载地址格式错误"}</span>',
                  visible=True
              )
      else: # OBS
          missing = []
          if not in_ak or in_ak.strip()=="":
              missing.append("AK")
          if not in_sk or in_sk.strip()=="":
              missing.append("SK")
          if not in_token or in_token.strip()=="":
              missing.append("sessionToken")
          if not in_endpoint or in_endpoint.strip()=="":
              missing.append("Endpoint")
          if not in_region or in_region.strip()=="":
              missing.append("Region")
          if not in_bucket or in_bucket.strip()=="":
              missing.append("BucketName")
          if not in_filename or in_filename.strip()=="":
              missing.append("FileName")
          if missing:
              obs_in_error_val = gr.Markdown.update(
                  value=f'<span style="color: red">{"OBS输入缺少: "+", ".join(missing)}</span>',
                  visible=True
              )

      # 输出
      if dest_type == "OBS":
          missing_out = []
          if not out_ak or out_ak.strip()=="":
              missing_out.append("输出AK")
          if not out_sk or out_sk.strip()=="":
              missing_out.append("输出SK")
          if not out_token or out_token.strip()=="":
              missing_out.append("输出SessionToken")
          if not out_endpoint or out_endpoint.strip()=="":
              missing_out.append("输出Endpoint")
          if not out_region or out_region.strip()=="":
              missing_out.append("输出Region")
          if not out_bucket or out_bucket.strip()=="":
              missing_out.append("输出BucketName")
          if missing_out:
              obs_out_error_val = gr.Markdown.update(
                  value=f'<span style="color: red">{"OBS输出缺少: "+", ".join(missing_out)}</span>',
                  visible=True
              )

      # 3) 如果有错误 -> 不调用后端
      has_error = any([
          model_error_val["visible"],
          local_file_error_val["visible"],
          public_url_error_val["visible"],
          obs_in_error_val["visible"],
          obs_out_error_val["visible"]
      ])
      if has_error:
          return (
              result_url_val,
              model_error_val,
              local_file_error_val,
              public_url_error_val,
              obs_in_error_val,
              obs_out_error_val
          )

      # 4) 无错 => 调后端
      data = {
          "model_vendor": (
              "none" if model_vendor=="无"
              else "openai"
          ),
          "openai_api_key": openai_api_key or "",
          "openai_base_url": openai_base_url or "",
          "openai_model_name": openai_model_name or "",
          "dest_type": dest_type
      }
      files = {}

      if file_source == "本地上传":
          data["file_source_type"] = "local"

          filename = local_file.name
          content = ''
          with open(filename, 'rb') as f:
              content = f.read()
          files["source_file"] = (filename, content)
      elif file_source == "Web地址":
          data["file_source_type"] = "url"
          data["source_file_url"] = public_url
      else:
          data["file_source_type"] = "OBS"
          obs_in = {
              "ak": in_ak,
              "sk": in_sk,
              "session_token": in_token,
              "endpoint": in_endpoint,
              "region": in_region,
              "bucket_name": in_bucket,
              "file_name": in_filename
          }
          data["obs_input_config"] = json.dumps(obs_in)

      if dest_type == "OBS":
          obs_out = {
              "ak": out_ak,
              "sk": out_sk,
              "session_token": out_token,
              "endpoint": out_endpoint,
              "region": out_region,
              "bucket_name": out_bucket
          }
          data["obs_output_config"] = json.dumps(obs_out)

      resp = requests.post("http://localhost:8080/process-file", data=data, files=files)
      if resp.status_code == 200:
          dest_url = resp.json().get("dest_url", "")
          if dest_url:
              result_url_val = f'<a href="{dest_url}" target="_blank">【处理成功, 点击下载】 </a>'
          else:
              result_url_val = "No URL returned, please contact admin"
      else:
          result_url_val = f'<span style="color: red">{resp.text}</span>'
    except Exception as e:
        model_error_val = gr.Markdown.update(
            value=f'<span style="color: red">{str(e)}</span>',
            visible=True
        )

    return (
        result_url_val,
        model_error_val,
        local_file_error_val,
        public_url_error_val,
        obs_in_error_val,
        obs_out_error_val
    )

def build_interface():
    with gr.Blocks(title="MarkItDown") as demo:
        gr.Markdown("""
                    # MarkItDown
                     **Tool for converting files and office documents to Markdown !**
                    """)

        # 大模型
        with gr.Group():
          model_vendor = gr.Dropdown(
              ["无","OpenAI"],
              value="无", label="大模型"
          )
          openai_api_key = gr.Textbox(label="OpenAI API Key", visible=False, type="password", placeholder="请输入可用的 API Key")
          openai_base_url = gr.Textbox(label="OpenAI Base URL", visible=False, placeholder="请输入可用的 Base URL (可选)")
          openai_model_name = gr.Textbox(label="OpenAI 模型名称", visible=False, value="gpt-3.5-turbo")
          model_tips = gr.Markdown(value="", visible=False)
          model_error = gr.Markdown(value="", visible=False, elem_classes="error-message")

        model_vendor.change(
            fn=update_model_fields,
            inputs=[model_vendor],
            outputs=[openai_api_key, openai_base_url, openai_model_name, model_tips, model_error],
            queue=False
        )

        gr.Markdown("---")

        # File source section
        with gr.Group():
          file_source = gr.Radio(
              ["本地上传","Web地址","OBS"],
              value="本地上传",
              label="文件来源"
          )
          local_file = gr.File(label="本地文件", visible=True,  file_types=["file"], file_count="single")
          local_file_error = gr.Markdown(value="", visible=False, elem_classes="error-message")

          public_url = gr.Textbox(label="Web地址", visible=False, placeholder="请输入可下载的内容地址, http:// 或 https:// 开头 或 ftp:// 开头")
          public_url_error = gr.Markdown(value="", visible=False, elem_classes="error-message")


          # OBS Input
          in_ak = gr.Textbox(label="OBS 输入AK", visible=False, type="password", placeholder="请输入 OBS AccessKey")
          in_sk = gr.Textbox(label="OBS 输入SK", visible=False, type="password", placeholder="请输入 OBS SecretKey")
          in_token = gr.Textbox(label="OBS sessionToken", visible=False, type="password", placeholder="请输入 OBS sessionToken")
          in_endpoint = gr.Textbox(label="OBS Endpoint", visible=False, placeholder="请输入 OBS Endpoint, 例如 http://beiing.xx.xx.net")
          in_region = gr.Textbox(label="OBS Region", visible=False, placeholder="请输入 OBS Region, 例如 beijing2")
          in_bucket = gr.Textbox(label="OBS BucketName", visible=False, placeholder="请输入 OBS BucketName")
          in_filename = gr.Textbox(label="OBS FileName", visible=False, placeholder="请输入 OBS 文件名")

          obs_in_error = gr.Markdown(value="", visible=False, elem_classes="error-message")

        file_source.change(
            fn=update_file_source_fields,
            inputs=[file_source],
            outputs=[
                local_file, public_url,
                in_ak, in_sk, in_token, in_endpoint, in_region, in_bucket, in_filename,
                local_file_error, public_url_error, obs_in_error
            ],
            queue=False
        )

        gr.Markdown("---")

        # Output section
        with gr.Group():
          dest_type = gr.Radio(["下载地址","OBS"], value="下载地址", label="输出类型")

          out_ak = gr.Textbox(label="OBS 输出AK", visible=False, type="password", placeholder="请输入 OBS AccessKey")
          out_sk = gr.Textbox(label="OBS 输出SK", visible=False, type="password", placeholder="请输入 OBS SecretKey")
          out_token = gr.Textbox(label="OBS 输出SessionToken", visible=False, type="password", placeholder="请输入 OBS sessionToken")
          out_endpoint = gr.Textbox(label="OBS 输出Endpoint", visible=False, placeholder="请输入 OBS Endpoint, 例如 http://beiing.xx.xx.net")
          out_region = gr.Textbox(label="OBS 输出Region", visible=False, placeholder="请输入 OBS Region, 例如 beijing2")
          out_bucket = gr.Textbox(label="OBS 输出BucketName", visible=False, placeholder="请输入 OBS BucketName")
          obs_out_error = gr.Markdown(value="", visible=False, elem_classes="error-message")

        dest_type.change(
            fn=update_dest_type_fields,
            inputs=[dest_type],
            outputs=[out_ak, out_sk, out_token, out_endpoint, out_region, out_bucket, obs_out_error],
            queue=False
        )

        # Process button and result
        with gr.Group():
            submit_btn = gr.Button("处理文件", variant="primary")
            result_url = gr.Markdown(label="结果链接", value="", visible=True)

        submit_btn.click(
            fn=gradio_process,
            inputs=[
                # 大模型
                model_vendor, openai_api_key, openai_base_url, openai_model_name,
                # 文件来源
                file_source, local_file, public_url,
                in_ak, in_sk, in_token, in_endpoint, in_region, in_bucket, in_filename,
                # 输出
                dest_type, out_ak, out_sk, out_token, out_endpoint, out_region, out_bucket
            ],
            outputs=[
                result_url,
                model_error, local_file_error, public_url_error, obs_in_error, obs_out_error
            ]
        )

    return demo

gradio_app = build_interface()
app = mount_gradio_app(app, gradio_app, path="/")



if __name__=="__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)