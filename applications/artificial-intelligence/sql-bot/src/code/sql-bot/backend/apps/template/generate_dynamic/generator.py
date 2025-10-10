from apps.template.template import get_base_template


def get_dynamic_template():
    template = get_base_template()
    return template['template']['dynamic_sql']
