import gradio as gr
import importlib
from concurrent.futures import ThreadPoolExecutor
from unstructured.partition.pdf import partition_pdf
from unstructured.partition.docx import partition_docx
from unstructured.partition.html import partition_html
from unstructured.partition.image import partition_image
from unstructured.partition.csv import partition_csv
from unstructured.partition.pptx import partition_pptx
from unstructured.partition.xlsx import partition_xlsx
from unstructured.partition.email import partition_email
from unstructured.partition.text import partition_text
import os
import tempfile

# 处理文件函数
def process_file(file):
    try:
        if isinstance(file, list):  # 确保只处理一个文件
            file = file[0]
        
        file_extension = file.name.split('.')[-1].lower()
        extracted_content = ""

        # 延迟加载处理函数
        if file_extension == 'pdf':
            partition_pdf = importlib.import_module('unstructured.partition.pdf').partition_pdf
            extracted_content = partition_pdf(file.name)
        elif file_extension == 'docx':
            partition_docx = importlib.import_module('unstructured.partition.docx').partition_docx
            extracted_content = partition_docx(file.name)
        elif file_extension == 'html':
            partition_html = importlib.import_module('unstructured.partition.html').partition_html
            extracted_content = partition_html(file.name)
        elif file_extension in ['jpg', 'jpeg', 'png']:
            partition_image = importlib.import_module('unstructured.partition.image').partition_image
            extracted_content = partition_image(file.name)
        elif file_extension == 'csv':
            partition_csv = importlib.import_module('unstructured.partition.csv').partition_csv
            extracted_content = partition_csv(file.name)
        elif file_extension == 'pptx':
            partition_pptx = importlib.import_module('unstructured.partition.pptx').partition_pptx
            extracted_content = partition_pptx(file.name)
        elif file_extension == 'xlsx':
            partition_xlsx = importlib.import_module('unstructured.partition.xlsx').partition_xlsx
            extracted_content = partition_xlsx(file.name)
        elif file_extension == 'eml':
            partition_email = importlib.import_module('unstructured.partition.email').partition_email
            extracted_content = partition_email(file.name)
        elif file_extension == 'txt':
            partition_text = importlib.import_module('unstructured.partition.text').partition_text
            extracted_content = partition_text(file.name)
        else:
            return f"不支持的文件类型: {file_extension}", None
        
        # 提取文本
        extracted_text = "\n".join(
            [element.text if hasattr(element, 'text') else element for element in extracted_content]
        )
        return extracted_text, None

    except FileNotFoundError:
        return "文件未找到，无法处理。", None
    except Exception as e:
        return f"处理错误: {str(e)}", None

# 处理多个文件
def process_multiple_files(files):
    results = []
    with ThreadPoolExecutor() as executor:
        futures = {executor.submit(process_file, file): file for file in files}
        for future in futures:
            content, _ = future.result()
            with tempfile.NamedTemporaryFile(delete=False, mode='w', encoding='utf-8') as temp_file:
                temp_file.write(content)
                temp_file_path = temp_file.name
            results.append((content, temp_file_path))
    return results

# Gradio界面设置
with gr.Blocks() as demo:
    gr.Markdown("""
    # **Unstructured文件处理器演示**
    上传文件（PDF, DOCX, PPTX, XLSX, CSV, HTML, 图像等），提取文件内容并进行处理。
    选择处理方式和输出格式。
    """)

    with gr.Row():
        with gr.Column(scale=1):
            # 文件上传，支持上传多个文件
            file_input = gr.Files(
                label="上传文档", 
                file_types=[".pdf", ".docx", ".html", ".jpg", ".jpeg", ".png", ".csv", ".pptx", ".xlsx", ".eml", ".txt"],
                interactive=True  # 允许交互式上传
            )
            process_button = gr.Button("处理文件")
            clear_button = gr.ClearButton()

        with gr.Column(scale=2):
            output_text = gr.Textbox(label="处理后的内容", interactive=False, lines=15, max_lines=30)
            download_links = gr.Files(label="下载处理后的文件", interactive=False)  # 允许下载多个文件

    def disable_upload_on_success(file_input):
        """
        处理成功后禁用文件上传，防止重新上传相同文件。
        """
        if isinstance(file_input, gr.File):  # 确保file_input是gr.File组件
            file_input.update(interactive=False)  # 禁用上传
        return file_input

    def enable_upload_on_clear(file_input):
        """
        清除后启用文件上传，用户可以重新上传文件。
        """
        if isinstance(file_input, gr.File):  # 确保file_input是gr.File组件
            file_input.update(interactive=True)  # 启用上传
        return file_input

    # 处理多个文件并生成下载链接
    def process_and_generate_links(files):
        results = process_multiple_files(files)
        contents = [result[0] for result in results]
        links = [result[1] for result in results]
        return contents, links

    process_button.click(fn=process_and_generate_links, inputs=[file_input], outputs=[output_text, download_links])
    
    # 处理后禁用文件上传
    process_button.click(fn=disable_upload_on_success, inputs=[file_input], outputs=[file_input])

    # 清除按钮重置
    clear_button.click(
        fn=lambda: [file_input.reset(), output_text.reset(), download_links.reset()],
        outputs=[file_input, output_text, download_links]
    )

    demo.launch(server_name="0.0.0.0", server_port=7860, share=True)  # 设置 share=True 创建公共链接

