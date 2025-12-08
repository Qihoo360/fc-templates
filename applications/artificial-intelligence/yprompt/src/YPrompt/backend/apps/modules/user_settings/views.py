# -*- coding: utf-8 -*-
from sanic import Blueprint
from sanic.response import json
from sanic_ext import openapi
from apps.utils.auth_middleware import auth_required
from .services import UserSettingsService
from .models import AIConfigModel, AIConfigResponse

user_settings = Blueprint('user_settings', url_prefix='/api/user-settings')

@user_settings.get('/ai-config')
@auth_required
@openapi.summary("Get user AI configuration")
@openapi.description("Get current user's AI provider and model configuration")
@openapi.response(200, {"application/json": AIConfigResponse})
async def get_ai_config(request):
    """Get user AI configuration"""
    try:
        user_id = request.ctx.user_id
        service = UserSettingsService(request.app.ctx.db)
        ai_config = await service.get_ai_config(user_id)
        
        if not ai_config:
            return json({
                'code': 200,
                'data': None,
                'message': 'No custom configuration'
            })
        
        return json({
            'code': 200,
            'data': ai_config
        })
        
    except Exception as e:
        return json({
            'code': 500,
            'message': f'Failed to get AI config: {str(e)}'
        }, status=500)

@user_settings.post('/ai-config')
@auth_required
@openapi.summary("Save user AI configuration")
@openapi.description("Save or update current user's AI provider and model configuration")
@openapi.body({"application/json": AIConfigModel})
@openapi.response(200, {"application/json": AIConfigResponse})
async def save_ai_config(request):
    """Save user AI configuration"""
    try:
        user_id = request.ctx.user_id
        config_data = request.json
        
        service = UserSettingsService(request.app.ctx.db)
        saved_config = await service.save_ai_config(user_id, config_data)
        
        return json({
            'code': 200,
            'data': saved_config,
            'message': 'Saved successfully'
        })
        
    except Exception as e:
        return json({
            'code': 500,
            'message': f'Failed to save AI config: {str(e)}'
        }, status=500)

@user_settings.delete('/ai-config')
@auth_required
@openapi.summary("Delete user AI configuration")
@openapi.description("Delete current user's AI configuration and restore defaults")
@openapi.response(200, {"application/json": dict})
async def delete_ai_config(request):
    """Delete user AI configuration (reset to default)"""
    try:
        user_id = request.ctx.user_id
        service = UserSettingsService(request.app.ctx.db)
        await service.delete_ai_config(user_id)
        
        return json({
            'code': 200,
            'message': 'Reset to default configuration'
        })
        
    except Exception as e:
        return json({
            'code': 500,
            'message': f'Failed to delete AI config: {str(e)}'
        }, status=500)
