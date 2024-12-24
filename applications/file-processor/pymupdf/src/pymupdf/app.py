import gradio as gr
import pymupdf # imports the pymupdf library
import uuid
import os

def process_file(file):
    doc = pymupdf.open(file.name) # open a document
    output_dir = "/mnt/pymupdf/output"
    if os.path.isdir(output_dir) == False:
        try:
            os.mkdir(output_dir)
        except FileExistsError:
            return gr.File()
    
    output_file = f"{output_dir}/{os.path.basename(file.name)}-{uuid.uuid4()}"
    with open(output_file, 'a') as output_obj:
        for page in doc: # iterate the document pages
            text = page.get_text() # get plain text encoded as UTF-8
            output_obj.write(text)
    os.remove(file.name)
    return gr.File(value=output_file)

iface = gr.Interface(
    fn=process_file,
    inputs=gr.File(),
    outputs=gr.File(),
    title="PyMuPDF",
    description="Data extraction, analysis, conversion & manipulation of PDF (and other) documents",
)

iface.launch()
