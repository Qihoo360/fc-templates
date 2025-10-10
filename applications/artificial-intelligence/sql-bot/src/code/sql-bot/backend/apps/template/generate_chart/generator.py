from apps.template.template import get_base_template


def get_chart_template():
    template = get_base_template()
    return template['template']['chart']

def get_base_terminology_template():
    template = get_base_template()
    return template['template']['terminology']

def get_base_data_training_template():
    template = get_base_template()
    return template['template']['data_training']
