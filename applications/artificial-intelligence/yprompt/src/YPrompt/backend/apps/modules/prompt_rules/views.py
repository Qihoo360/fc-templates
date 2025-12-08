from sanic import Blueprint
from sanic.response import json
from sanic_ext import openapi
from apps.utils.auth_middleware import auth_required
from .services import PromptRulesService
from .models import PromptRulesModel, PromptRulesResponse

prompt_rules = Blueprint('prompt_rules', url_prefix='/api/prompt-rules')

@prompt_rules.get('/')
@auth_required
@openapi.summary("获取用户的提示词规则")
@openapi.description("获取当前登录用户的自定义提示词规则")
@openapi.response(200, {"application/json": PromptRulesResponse})
async def get_rules(request):
    """获取用户的提示词规则"""
    try:
        user_id = request.ctx.user_id
        service = PromptRulesService(request.app.ctx.db)
        rules = await service.get_user_rules(user_id)
        
        if not rules:
            return json({
                'code': 200,
                'data': None,
                'message': '用户暂无自定义规则'
            })
        
        return json({
            'code': 200,
            'data': rules
        })
        
    except Exception as e:
        return json({
            'code': 500,
            'message': f'获取提示词规则失败: {str(e)}'
        }, status=500)

@prompt_rules.post('/')
@auth_required
@openapi.summary("保存用户的提示词规则")
@openapi.description("保存或更新当前登录用户的自定义提示词规则")
@openapi.body({"application/json": PromptRulesModel})
@openapi.response(200, {"application/json": PromptRulesResponse})
async def save_rules(request):
    """保存用户的提示词规则"""
    try:
        user_id = request.ctx.user_id
        rules_data = request.json
        
        service = PromptRulesService(request.app.ctx.db)
        saved_rules = await service.save_user_rules(user_id, rules_data)
        
        return json({
            'code': 200,
            'data': saved_rules,
            'message': '保存成功'
        })
        
    except Exception as e:
        return json({
            'code': 500,
            'message': f'保存提示词规则失败: {str(e)}'
        }, status=500)

@prompt_rules.delete('/')
@auth_required
@openapi.summary("删除用户的提示词规则")
@openapi.description("删除当前登录用户的自定义提示词规则，恢复使用默认规则")
@openapi.response(200, {"application/json": dict})
async def delete_rules(request):
    """删除用户的提示词规则（重置为默认）"""
    try:
        user_id = request.ctx.user_id
        service = PromptRulesService(request.app.ctx.db)
        await service.delete_user_rules(user_id)
        
        return json({
            'code': 200,
            'message': '已重置为默认规则'
        })
        
    except Exception as e:
        return json({
            'code': 500,
            'message': f'删除提示词规则失败: {str(e)}'
        }, status=500)
