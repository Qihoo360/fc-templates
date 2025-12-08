"""
版本管理路由
处理提示词版本管理相关的API请求
"""
from sanic import Blueprint
from sanic.response import json
from sanic_ext import openapi
from sanic.log import logger

from apps.utils.auth_middleware import auth_required
from .services import VersionService
from .models import *


# 创建版本管理蓝图
versions = Blueprint('versions', url_prefix='/api/versions')


@versions.post('/<prompt_id:int>')
@auth_required
@openapi.summary("创建新版本")
@openapi.description("保存当前提示词内容为新版本")
@openapi.secured("BearerAuth")
@openapi.body({"application/json": CreateVersionRequest}, description="版本信息", required=True)
@openapi.response(200, {"application/json": CreateVersionResponse}, description="创建成功")
@openapi.response(400, {"application/json": ErrorResponse}, description="参数错误")
@openapi.response(404, {"application/json": ErrorResponse}, description="提示词不存在")
async def create_version(request, prompt_id):
    """创建新版本"""
    try:
        user_id = request.ctx.user_id
        data = request.json
        
        # 参数验证
        if not data.get('change_type'):
            return json({
                'code': 400,
                'message': '缺少change_type参数'
            })
        
        if data['change_type'] not in ['major', 'minor', 'patch']:
            return json({
                'code': 400,
                'message': 'change_type必须是major、minor或patch'
            })
        
        if not data.get('change_summary'):
            return json({
                'code': 400,
                'message': '缺少change_summary参数'
            })
        
        # 创建版本
        version_service = VersionService(request.app.ctx.db)
        result = await version_service.create_version(prompt_id, user_id, data)
        
        return json({
            'code': 200,
            'message': '版本创建成功',
            'data': result
        })
        
    except ValueError as e:
        return json({
            'code': 404,
            'message': str(e)
        })
    except Exception as e:
        logger.error(f'❌ 创建版本失败: {e}')
        return json({
            'code': 500,
            'message': f'创建失败: {str(e)}'
        })


@versions.get('/<prompt_id:int>/versions')
@auth_required
@openapi.summary("获取版本列表")
@openapi.description("获取提示词的版本历史列表")
@openapi.secured("BearerAuth")
@openapi.parameter("page", int, "query", description="页码", required=False)
@openapi.parameter("limit", int, "query", description="每页数量", required=False)
@openapi.parameter("tag", str, "query", description="版本标签筛选", required=False)
@openapi.response(200, {"application/json": VersionListResponse}, description="查询成功")
async def get_version_list(request, prompt_id):
    """获取版本列表"""
    try:
        user_id = request.ctx.user_id
        
        # 获取查询参数
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        version_tag = request.args.get('tag', None)
        
        # 参数校验
        if page < 1:
            page = 1
        if limit < 1 or limit > 100:
            limit = 20
        
        # 查询列表
        version_service = VersionService(request.app.ctx.db)
        result = await version_service.get_version_history(
            prompt_id, user_id, page, limit, version_tag
        )
        
        return json({
            'code': 200,
            'data': result
        })
        
    except ValueError as e:
        return json({
            'code': 404,
            'message': str(e)
        })
    except Exception as e:
        logger.error(f'❌ 获取版本列表失败: {e}')
        return json({
            'code': 500,
            'message': f'查询失败: {str(e)}'
        })


@versions.get('/<prompt_id:int>/versions/<version_id:int>')
@auth_required
@openapi.summary("获取版本详情")
@openapi.description("获取指定版本的完整信息")
@openapi.secured("BearerAuth")
@openapi.response(200, {"application/json": VersionDetailResponse}, description="查询成功")
@openapi.response(404, {"application/json": ErrorResponse}, description="版本不存在")
async def get_version_detail(request, prompt_id, version_id):
    """获取版本详情"""
    try:
        user_id = request.ctx.user_id
        
        # 查询详情
        version_service = VersionService(request.app.ctx.db)
        version = await version_service.get_version_detail(prompt_id, user_id, version_id)
        
        return json({
            'code': 200,
            'data': version
        })
        
    except ValueError as e:
        return json({
            'code': 404,
            'message': str(e)
        })
    except Exception as e:
        logger.error(f'❌ 获取版本详情失败: {e}')
        return json({
            'code': 500,
            'message': f'查询失败: {str(e)}'
        })


@versions.get('/<prompt_id:int>/versions/compare')
@auth_required
@openapi.summary("版本对比")
@openapi.description("对比两个版本的差异")
@openapi.secured("BearerAuth")
@openapi.parameter("from", int, "query", description="源版本ID", required=True)
@openapi.parameter("to", int, "query", description="目标版本ID", required=True)
@openapi.response(200, {"application/json": VersionCompareResponse}, description="对比成功")
async def compare_versions(request, prompt_id):
    """版本对比"""
    try:
        user_id = request.ctx.user_id
        
        # 获取参数
        from_version_id = request.args.get('from')
        to_version_id = request.args.get('to')
        
        if not from_version_id or not to_version_id:
            return json({
                'code': 400,
                'message': '缺少from或to参数'
            })
        
        from_version_id = int(from_version_id)
        to_version_id = int(to_version_id)
        
        # 对比版本
        version_service = VersionService(request.app.ctx.db)
        result = await version_service.compare_versions(
            prompt_id, user_id, from_version_id, to_version_id
        )
        
        return json({
            'code': 200,
            'data': result
        })
        
    except ValueError as e:
        return json({
            'code': 404,
            'message': str(e)
        })
    except Exception as e:
        logger.error(f'❌ 版本对比失败: {e}')
        return json({
            'code': 500,
            'message': f'对比失败: {str(e)}'
        })


@versions.post('/<prompt_id:int>/versions/<version_id:int>/rollback')
@auth_required
@openapi.summary("回滚到指定版本")
@openapi.description("将提示词回滚到历史版本")
@openapi.secured("BearerAuth")
@openapi.body({"application/json": RollbackRequest}, description="回滚信息", required=False)
@openapi.response(200, {"application/json": RollbackResponse}, description="回滚成功")
async def rollback_version(request, prompt_id, version_id):
    """回滚版本"""
    try:
        user_id = request.ctx.user_id
        data = request.json or {}
        
        # 回滚
        version_service = VersionService(request.app.ctx.db)
        result = await version_service.rollback_to_version(
            prompt_id, user_id, version_id, 
            data.get('change_summary', None)
        )
        
        return json({
            'code': 200,
            'message': '回滚成功',
            'data': result
        })
        
    except ValueError as e:
        return json({
            'code': 404,
            'message': str(e)
        })
    except Exception as e:
        logger.error(f'❌ 回滚失败: {e}')
        return json({
            'code': 500,
            'message': f'回滚失败: {str(e)}'
        })


@versions.put('/<prompt_id:int>/versions/<version_id:int>/tag')
@auth_required
@openapi.summary("更新版本标签")
@openapi.description("修改版本的标签")
@openapi.secured("BearerAuth")
@openapi.body({"application/json": UpdateTagRequest}, description="标签信息", required=True)
@openapi.response(200, {"application/json": SuccessResponse}, description="更新成功")
async def update_version_tag(request, prompt_id, version_id):
    """更新版本标签"""
    try:
        user_id = request.ctx.user_id
        data = request.json
        
        # 参数验证
        if not data.get('version_tag'):
            return json({
                'code': 400,
                'message': '缺少version_tag参数'
            })
        
        # 更新标签
        version_service = VersionService(request.app.ctx.db)
        await version_service.update_version_tag(
            prompt_id, user_id, version_id, data['version_tag']
        )
        
        return json({
            'code': 200,
            'message': '标签更新成功'
        })
        
    except ValueError as e:
        return json({
            'code': 404,
            'message': str(e)
        })
    except Exception as e:
        logger.error(f'❌ 更新标签失败: {e}')
        return json({
            'code': 500,
            'message': f'更新失败: {str(e)}'
        })


@versions.delete('/<prompt_id:int>/versions/<version_id:int>')
@auth_required
@openapi.summary("删除版本")
@openapi.description("删除指定版本（软删除）")
@openapi.secured("BearerAuth")
@openapi.response(200, {"application/json": SuccessResponse}, description="删除成功")
async def delete_version(request, prompt_id, version_id):
    """删除版本"""
    try:
        user_id = request.ctx.user_id
        
        # 删除版本
        version_service = VersionService(request.app.ctx.db)
        await version_service.delete_version(prompt_id, user_id, version_id)
        
        return json({
            'code': 200,
            'message': '版本删除成功'
        })
        
    except ValueError as e:
        return json({
            'code': 400,
            'message': str(e)
        })
    except Exception as e:
        logger.error(f'❌ 删除版本失败: {e}')
        return json({
            'code': 500,
            'message': f'删除失败: {str(e)}'
        })

