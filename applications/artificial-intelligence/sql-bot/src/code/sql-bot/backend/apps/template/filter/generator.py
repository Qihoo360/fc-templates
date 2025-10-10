from apps.template.template import get_base_template


def get_permissions_template():
    template = get_base_template()
    return template['template']['permissions']
