from apps.template.template import get_base_template


def get_guess_question_template():
    template = get_base_template()
    return template['template']['guess']
