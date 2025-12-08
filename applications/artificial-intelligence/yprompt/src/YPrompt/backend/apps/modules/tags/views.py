"""
标签路由
处理标签的查询和创建
"""
from sanic import Blueprint
from sanic.response import json
from sanic_ext import openapi
from sanic.log import logger

from apps.utils.auth_middleware import auth_required
from .services import TagService


# 创建标签蓝图
tags = Blueprint('tags', url_prefix='/api/tags')


@tags.get('/')
@auth_required
@openapi.summary("获取用户标签列表")
@openapi.description("获取当前用户的所有标签,按使用次数降序")
@openapi.secured("BearerAuth")
@openapi.parameter("limit", int, "query", description="返回数量限制", required=False)
@openapi.response(200, {"application/json": {"code": int, "data": list}}, description="查询成功")
async def get_tags(request):
    """获取标签列表"""
    try:
        user_id = request.ctx.user_id
        limit = int(request.args.get('limit', 50))
        
        # 参数校验
        if limit < 1 or limit > 100:
            limit = 50
        
        # 查询标签列表
        tag_service = TagService(request.app.ctx.db)
        tags_list = await tag_service.get_user_tags(user_id, limit)
        
        return json({
            'code': 200,
            'data': tags_list
        })
        
    except Exception as e:
        logger.error(f'❌ 查询标签列表失败: {e}')
        return json({
            'code': 500,
            'message': f'查询失败: {str(e)}'
        })


@tags.post('/')
@auth_required
@openapi.summary("创建标签")
@openapi.description("创建新标签,如果已存在则返回已有标签")
@openapi.secured("BearerAuth")
@openapi.body({"application/json": {"tag_name": str}}, description="标签名称", required=True)
@openapi.response(200, {"application/json": {"code": int, "message": str, "data": dict}}, description="创建成功")
async def create_tag(request):
    """创建标签"""
    try:
        user_id = request.ctx.user_id
        data = request.json
        tag_name = data.get('tag_name', '').strip()
        
        # 参数验证
        if not tag_name:
            return json({
                'code': 400,
                'message': '标签名称不能为空'
            })
        
        if len(tag_name) > 50:
            return json({
                'code': 400,
                'message': '标签名称不能超过50个字符'
            })
        
        # 创建标签
        tag_service = TagService(request.app.ctx.db)
        tag = await tag_service.create_tag(user_id, tag_name)
        
        return json({
            'code': 200,
            'message': '创建成功',
            'data': tag
        })
        
    except Exception as e:
        logger.error(f'❌ 创建标签失败: {e}')
        return json({
            'code': 500,
            'message': f'创建失败: {str(e)}'
        })


@tags.delete('/<tag_id:int>')
@auth_required
@openapi.summary("删除标签")
@openapi.description("删除指定标签")
@openapi.secured("BearerAuth")
@openapi.response(200, {"application/json": {"code": int, "message": str}}, description="删除成功")
async def delete_tag(request, tag_id):
    """删除标签"""
    try:
        user_id = request.ctx.user_id
        
        # 删除标签
        tag_service = TagService(request.app.ctx.db)
        success = await tag_service.delete_tag(user_id, tag_id)
        
        if not success:
            return json({
                'code': 403,
                'message': '无权限删除或标签不存在'
            })
        
        return json({
            'code': 200,
            'message': '删除成功'
        })
        
    except Exception as e:
        logger.error(f'❌ 删除标签失败: {e}')
        return json({
            'code': 500,
            'message': f'删除失败: {str(e)}'
        })


@tags.get('/popular')
@auth_required
@openapi.summary("获取热门标签")
@openapi.description("获取当前用户最常用的标签")
@openapi.secured("BearerAuth")
@openapi.parameter("limit", int, "query", description="返回数量限制", required=False)
@openapi.response(200, {"application/json": {"code": int, "data": list}}, description="查询成功")
async def get_popular_tags(request):
    """获取热门标签"""
    try:
        user_id = request.ctx.user_id
        limit = int(request.args.get('limit', 20))
        
        # 参数校验
        if limit < 1 or limit > 50:
            limit = 20
        
        # 查询热门标签
        tag_service = TagService(request.app.ctx.db)
        tags_list = await tag_service.get_popular_tags(user_id, limit)
        
        return json({
            'code': 200,
            'data': tags_list
        })
        
    except Exception as e:
        logger.error(f'❌ 查询热门标签失败: {e}')
        return json({
            'code': 500,
            'message': f'查询失败: {str(e)}'
        })

