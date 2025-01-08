import gradio as gr
import uuid
import os

def process_file(from_fmt, to_fmt, file):
    output_dir = "/tmp/output"
    if os.path.isdir(output_dir) == False:
        try:
            os.mkdir(output_dir)
        except FileExistsError:
            return gr.File()
        
    output = f"{output_dir}/{os.path.basename(file.name)}/{uuid.uuid4()}"
    try:
        os.makedirs(output)
    except FileExistsError:
        return gr.File()
    
    cmd = "docling "
    if from_fmt != "":
        cmd += f"--from {from_fmt} "
    if to_fmt != "":
        cmd += f"--to {to_fmt} "
    cmd += f" --output {output} {file.name} > {output}/error.txt 2>&1"
    print("file is :" + file.name)
    os.system(cmd)
    output_files = os.listdir(output)
    if output_files:
        output_filename =  output + "/" + os.listdir(output)[0]
    else:
        output_filename = f"{output}/error.txt"
    # os.remove(file.name)
    return gr.File(value=output_filename)

iface = gr.Interface(
    fn=process_file,
    # inputs=[gr.Textbox(label="docling command options: ") , gr.Files(file_count="multiple", type='filepath')],
    # outputs=gr.Files(file_count="multiple", type='filepath'),
    # inputs=[gr.Textbox(label="from: [docx|pptx|html|image|pdf|asciidoc|md|xlsx]"), gr.Textbox(label="to: [md|json|text|doctags]"), gr.File()],
    inputs=[
        gr.Dropdown(label="From fmt", choices=["pdf", "docx", "pptx", "html", "image", "asciidoc", "md", "xlsx"]), 
        gr.Dropdown(label="To fmt", choices=["md", "json", "text", "doctags"]), 
        gr.File()],
    outputs=gr.File(),
    #inputs=gr.Files(file_count="multiple", type='binary'),
    #outputs=gr.Files(file_count="multiple", type='binary'),
    title="Convert file format",
    description="Input docling cmd options and upload files for converting",
)

iface.launch()
