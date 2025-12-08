from sanic_ext import openapi

@openapi.component
class PromptRulesModel:
    """用户提示词规则模型"""
    system_prompt_rules: str = openapi.String(description="系统提示词规则")
    user_guided_prompt_rules: str = openapi.String(description="用户引导规则")
    requirement_report_rules: str = openapi.String(description="需求报告规则")
    thinking_points_extraction_prompt: str = openapi.String(description="关键指令提取提示词")
    thinking_points_system_message: str = openapi.String(description="关键指令系统消息")
    system_prompt_generation_prompt: str = openapi.String(description="系统提示词生成提示词")
    system_prompt_system_message: str = openapi.String(description="系统提示词系统消息")
    optimization_advice_prompt: str = openapi.String(description="优化建议提示词")
    optimization_advice_system_message: str = openapi.String(description="优化建议系统消息")
    optimization_application_prompt: str = openapi.String(description="优化应用提示词")
    optimization_application_system_message: str = openapi.String(description="优化应用系统消息")
    quality_analysis_system_prompt: str = openapi.String(description="质量分析系统提示词")
    user_prompt_quality_analysis: str = openapi.String(description="用户提示词质量分析")
    user_prompt_quick_optimization: str = openapi.String(description="用户提示词快速优化")
    user_prompt_rules: str = openapi.String(description="用户提示词规则")

@openapi.component
class PromptRulesResponse:
    """提示词规则响应模型"""
    id: int = openapi.Integer(description="ID")
    user_id: int = openapi.Integer(description="用户ID")
    system_prompt_rules: str = openapi.String(description="系统提示词规则", nullable=True)
    user_guided_prompt_rules: str = openapi.String(description="用户引导规则", nullable=True)
    requirement_report_rules: str = openapi.String(description="需求报告规则", nullable=True)
    thinking_points_extraction_prompt: str = openapi.String(description="关键指令提取提示词", nullable=True)
    thinking_points_system_message: str = openapi.String(description="关键指令系统消息", nullable=True)
    system_prompt_generation_prompt: str = openapi.String(description="系统提示词生成提示词", nullable=True)
    system_prompt_system_message: str = openapi.String(description="系统提示词系统消息", nullable=True)
    optimization_advice_prompt: str = openapi.String(description="优化建议提示词", nullable=True)
    optimization_advice_system_message: str = openapi.String(description="优化建议系统消息", nullable=True)
    optimization_application_prompt: str = openapi.String(description="优化应用提示词", nullable=True)
    optimization_application_system_message: str = openapi.String(description="优化应用系统消息", nullable=True)
    quality_analysis_system_prompt: str = openapi.String(description="质量分析系统提示词", nullable=True)
    user_prompt_quality_analysis: str = openapi.String(description="用户提示词质量分析", nullable=True)
    user_prompt_quick_optimization: str = openapi.String(description="用户提示词快速优化", nullable=True)
    user_prompt_rules: str = openapi.String(description="用户提示词规则", nullable=True)
    create_time: str = openapi.String(description="创建时间", format="date-time")
    update_time: str = openapi.String(description="更新时间", format="date-time")
