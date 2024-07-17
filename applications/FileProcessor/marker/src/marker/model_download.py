from transformers import AutoModelForSequenceClassification, AutoTokenizer, SegformerForSemanticSegmentation, SegformerImageProcessor


def download_and_save_model(model_name, save_path):
    if "texify" in model_name:
        model = AutoModelForSequenceClassification.from_pretrained(model_name)
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model.save_pretrained(save_path)
        tokenizer.save_pretrained(save_path)
    else:
        model = SegformerForSemanticSegmentation.from_pretrained(model_name, ignore_mismatched_sizes=True)
        processor = SegformerImageProcessor.from_pretrained(model_name)
        model.save_pretrained(save_path)
        processor.save_pretrained(save_path)

# 定义模型及其保存目录
models = [
    ("vikp/surya_det2", "./models/surya_det2"),
    ("vikp/surya_layout2", "./models/surya_layout2"),
    ("vikp/surya_order", "./models/surya_order"),
    # ("vikp/pdf_postprocessor_t5", "./models/pdf_postprocessor_t5"),
    ("vikp/texify", "./models/texify"),
]

# 下载并保存每个模型
for model_name, save_directory in models:
    try:
        download_and_save_model(model_name, save_directory)
        print(f"Successfully downloaded and saved {model_name} to {save_directory}")
    except Exception as e:
        print(f"Failed to download {model_name}. Error: {e}")
        break