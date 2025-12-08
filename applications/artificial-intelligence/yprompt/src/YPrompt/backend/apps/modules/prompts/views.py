"""
提示词路由
处理提示词的增删改查等操作
"""
from sanic import Blueprint
from sanic.response import json
from sanic_ext import openapi
from sanic.log import logger

from apps.utils.auth_middleware import auth_required
from .services import PromptService
from .models import *


# 创建提示词蓝图
prompts = Blueprint('prompts', url_prefix='/api/prompts')


@prompts.post('/')
@auth_required
@openapi.summary("保存提示词(统一接口)")
@openapi.description("保存或更新提示词,自动判断新建/更新,自动创建版本")
@openapi.secured("BearerAuth")
@openapi.body({"application/json": SavePromptRequest}, description="提示词数据", required=True)
@openapi.response(200, {"application/json": SavePromptResponse}, description="保存成功")
@openapi.response(400, {"application/json": ErrorResponse}, description="参数错误")
@openapi.response(401, {"application/json": ErrorResponse}, description="未授权")
async def save_prompt(request):
    """
    统一的保存接口
    
    逻辑:
    1. 如果data中有id且存在 -> 更新已有提示词 + 创建新版本(如果create_version=True)
    2. 如果没有id或id不存在 -> 创建新提示词 + 创建初始版本
    
    请求参数:
    - id: 提示词ID(可选,如果提供则更新)
    - title: 标题
    - final_prompt: 最终提示词
    - create_version: 是否创建版本(默认True)
    - change_summary: 版本变更说明(可选)
    - ... 其他字段
    """
    try:
        user_id = request.ctx.user_id
        data = request.json
        
        # 参数验证
        if not data.get('title'):
            return json({
                'code': 400,
                'message': '标题不能为空'
            })
        
        if not data.get('final_prompt'):
            return json({
                'code': 400,
                'message': '最终提示词不能为空'
            })
        
        # 统一保存(自动判断新建还是更新)
        prompt_service = PromptService(request.app.ctx.db)
        result = await prompt_service.save_prompt(user_id, data)
        
        return json({
            'code': 200,
            'message': result.get('message', '保存成功'),
            'data': result
        })
        
    except ValueError as e:
        logger.warning(f'⚠️  参数错误: {e}')
        return json({
            'code': 400,
            'message': str(e)
        })
    except PermissionError as e:
        logger.warning(f'⚠️  权限错误: {e}')
        return json({
            'code': 403,
            'message': str(e)
        })
    except Exception as e:
        logger.error(f'❌ 保存提示词失败: {e}')
        return json({
            'code': 500,
            'message': f'保存失败: {str(e)}'
        })


@prompts.get('/')
@auth_required
@openapi.summary("获取提示词列表")
@openapi.description("分页获取用户的提示词列表,支持搜索和筛选")
@openapi.secured("BearerAuth")
@openapi.parameter("page", int, "query", description="页码", required=False)
@openapi.parameter("limit", int, "query", description="每页数量", required=False)
@openapi.parameter("keyword", str, "query", description="搜索关键词", required=False)
@openapi.parameter("tag", str, "query", description="标签筛选", required=False)
@openapi.parameter("is_favorite", str, "query", description="是否收藏 1/0", required=False)
@openapi.parameter("sort", str, "query", description="排序字段 create_time/update_time/view_count/use_count", required=False)
@openapi.response(200, {"application/json": PromptListResponse}, description="查询成功")
async def get_prompts_list(request):
    """获取提示词列表"""
    try:
        user_id = request.ctx.user_id
        
        # 获取查询参数
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        keyword = request.args.get('keyword', '')
        tag = request.args.get('tag', '')
        is_favorite = request.args.get('is_favorite', '')
        sort = request.args.get('sort', 'create_time')
        
        # 参数校验
        if page < 1:
            page = 1
        if limit < 1 or limit > 100:
            limit = 10
        
        # 查询列表
        prompt_service = PromptService(request.app.ctx.db)
        result = await prompt_service.get_prompts_list(
            user_id, page, limit, keyword, tag, is_favorite, sort
        )
        
        return json({
            'code': 200,
            'data': result
        })
        
    except Exception as e:
        logger.error(f'❌ 查询提示词列表失败: {e}')
        return json({
            'code': 500,
            'message': f'查询失败: {str(e)}'
        })


@prompts.get('/<prompt_id:int>')
@auth_required
@openapi.summary("获取提示词详情")
@openapi.description("获取指定提示词的完整信息")
@openapi.secured("BearerAuth")
@openapi.response(200, {"application/json": PromptDetailResponse}, description="查询成功")
@openapi.response(404, {"application/json": ErrorResponse}, description="不存在")
async def get_prompt_detail(request, prompt_id):
    """获取提示词详情"""
    try:
        user_id = request.ctx.user_id
        
        # 查询详情
        prompt_service = PromptService(request.app.ctx.db)
        prompt = await prompt_service.get_prompt_detail(user_id, prompt_id)
        
        if not prompt:
            return json({
                'code': 404,
                'message': '提示词不存在或无权限访问'
            })
        
        # 增加查看次数
        await prompt_service.increase_view_count(prompt_id)
        
        return json({
            'code': 200,
            'data': prompt
        })
        
    except Exception as e:
        logger.error(f'❌ 查询提示词详情失败: {e}')
        return json({
            'code': 500,
            'message': f'查询失败: {str(e)}'
        })


@prompts.put('/<prompt_id:int>')
@auth_required
@openapi.summary("更新提示词")
@openapi.description("更新指定提示词的信息")
@openapi.secured("BearerAuth")
@openapi.body({"application/json": SavePromptRequest}, description="更新数据", required=True)
@openapi.response(200, {"application/json": SuccessResponse}, description="更新成功")
@openapi.response(403, {"application/json": ErrorResponse}, description="无权限")
async def update_prompt(request, prompt_id):
    """更新提示词"""
    try:
        user_id = request.ctx.user_id
        data = request.json
        
        # 更新提示词
        prompt_service = PromptService(request.app.ctx.db)
        success = await prompt_service.update_prompt(user_id, prompt_id, data)
        
        if not success:
            return json({
                'code': 403,
                'message': '无权限修改或提示词不存在'
            })
        
        return json({
            'code': 200,
            'message': '更新成功'
        })
        
    except Exception as e:
        logger.error(f'❌ 更新提示词失败: {e}')
        return json({
            'code': 500,
            'message': f'更新失败: {str(e)}'
        })


@prompts.delete('/<prompt_id:int>')
@auth_required
@openapi.summary("删除提示词")
@openapi.description("删除指定提示词")
@openapi.secured("BearerAuth")
@openapi.response(200, {"application/json": SuccessResponse}, description="删除成功")
@openapi.response(403, {"application/json": ErrorResponse}, description="无权限")
async def delete_prompt(request, prompt_id):
    """删除提示词"""
    try:
        user_id = request.ctx.user_id
        
        # 删除提示词
        prompt_service = PromptService(request.app.ctx.db)
        success = await prompt_service.delete_prompt(user_id, prompt_id)
        
        if not success:
            return json({
                'code': 403,
                'message': '无权限删除或提示词不存在'
            })
        
        return json({
            'code': 200,
            'message': '删除成功'
        })
        
    except Exception as e:
        logger.error(f'❌ 删除提示词失败: {e}')
        return json({
            'code': 500,
            'message': f'删除失败: {str(e)}'
        })


@prompts.post('/<prompt_id:int>/favorite')
@auth_required
@openapi.summary("收藏/取消收藏提示词")
@openapi.description("切换提示词的收藏状态")
@openapi.secured("BearerAuth")
@openapi.body({"application/json": FavoriteRequest}, description="收藏状态", required=True)
@openapi.response(200, {"application/json": SuccessResponse}, description="操作成功")
async def toggle_favorite(request, prompt_id):
    """收藏/取消收藏"""
    try:
        user_id = request.ctx.user_id
        data = request.json
        is_favorite = data.get('is_favorite', True)
        
        # 切换收藏状态
        prompt_service = PromptService(request.app.ctx.db)
        success = await prompt_service.toggle_favorite(user_id, prompt_id, is_favorite)
        
        if not success:
            return json({
                'code': 403,
                'message': '操作失败或提示词不存在'
            })
        
        return json({
            'code': 200,
            'message': '操作成功'
        })
        
    except Exception as e:
        logger.error(f'❌ 操作收藏状态失败: {e}')
        return json({
            'code': 500,
            'message': f'操作失败: {str(e)}'
        })


@prompts.post('/<prompt_id:int>/use')
@auth_required
@openapi.summary("记录提示词使用")
@openapi.description("增加提示词的使用次数")
@openapi.secured("BearerAuth")
@openapi.response(200, {"application/json": SuccessResponse}, description="记录成功")
async def record_use(request, prompt_id):
    """记录使用次数"""
    try:
        user_id = request.ctx.user_id
        
        # 增加使用次数
        prompt_service = PromptService(request.app.ctx.db)
        success = await prompt_service.increase_use_count(user_id, prompt_id)
        
        if not success:
            return json({
                'code': 404,
                'message': '提示词不存在'
            })
        
        return json({
            'code': 200,
            'message': '记录成功'
        })
        
    except Exception as e:
        logger.error(f'❌ 记录使用次数失败: {e}')
        return json({
            'code': 500,
            'message': f'记录失败: {str(e)}'
        })

