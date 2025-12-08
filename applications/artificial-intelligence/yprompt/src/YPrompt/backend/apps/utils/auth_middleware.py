"""
认证中间件
用于保护需要登录的API接口
"""
from functools import wraps
from sanic.response import json
from sanic.log import logger
from apps.utils.jwt_utils import JWTUtil


def auth_required(func):
    """
    认证装饰器
    
    使用方法:
        @auth_required
        async def my_protected_route(request):
            user_id = request.ctx.user_id  # 从上下文获取用户ID
            open_id = request.ctx.open_id  # 从上下文获取open_id
            ...
    
    如果认证失败,返回401错误
    """
    @wraps(func)
    async def wrapper(request, *args, **kwargs):
        # 1. 获取Authorization头
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            logger.warning(f'❌ 未授权访问: {request.path} - 缺少Authorization头')
            return json({
                'code': 401,
                'message': '未授权,请先登录'
            }, status=200)
        
        # 2. 解析Bearer Token
        if not auth_header.startswith('Bearer '):
            logger.warning(f'❌ 未授权访问: {request.path} - Authorization头格式错误')
            return json({
                'code': 401,
                'message': '认证格式错误,请使用Bearer Token'
            }, status=200)
        
        token = auth_header.split(' ')[1]
        
        # 3. 验证Token
        payload = JWTUtil.verify_token(token)
        
        if not payload:
            logger.warning(f'❌ 未授权访问: {request.path} - Token无效或已过期')
            return json({
                'code': 401,
                'message': 'Token无效或已过期,请重新登录'
            }, status=200)
        
        # 4. 将用户信息添加到request上下文
        request.ctx.user_id = payload['user_id']
        request.ctx.open_id = payload['open_id']
        
        logger.debug(f'✅ 认证成功: user_id={payload["user_id"]}, path={request.path}')
        
        # 5. 调用原函数
        return await func(request, *args, **kwargs)
    
    return wrapper


def optional_auth(func):
    """
    可选认证装饰器
    
    如果有Token则验证,但不强制要求登录
    无论是否登录都会执行后续逻辑
    
    使用方法:
        @optional_auth
        async def my_route(request):
            user_id = getattr(request.ctx, 'user_id', None)  # 可能为None
            if user_id:
                # 已登录用户的逻辑
            else:
                # 未登录用户的逻辑
    """
    @wraps(func)
    async def wrapper(request, *args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        # 初始化用户信息为None
        request.ctx.user_id = None
        request.ctx.open_id = None
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            payload = JWTUtil.verify_token(token)
            
            if payload:
                request.ctx.user_id = payload['user_id']
                request.ctx.open_id = payload['open_id']
                logger.debug(f'✅ 可选认证: 已登录用户访问 user_id={payload["user_id"]}')
            else:
                logger.debug(f'⚠️  可选认证: Token无效,按未登录处理')
        else:
            logger.debug(f'⚠️  可选认证: 未登录用户访问 path={request.path}')
        
        return await func(request, *args, **kwargs)
    
    return wrapper


def admin_required(func):
    """
    管理员权限装饰器
    
    需要先经过auth_required认证,再检查是否为管理员
    
    使用方法:
        @auth_required
        @admin_required
        async def admin_route(request):
            # 只有管理员能访问
            ...
    """
    @wraps(func)
    async def wrapper(request, *args, **kwargs):
        user_id = request.ctx.user_id
        
        # TODO: 这里需要查询数据库判断用户是否为管理员
        # 暂时简化实现,可以根据实际需求扩展
        
        # 示例: 假设user_id为1的是管理员
        if user_id != 1:
            logger.warning(f'❌ 权限不足: user_id={user_id} 尝试访问管理员接口 {request.path}')
            return json({
                'code': 403,
                'message': '权限不足,需要管理员权限'
            }, status=200)
        
        logger.debug(f'✅ 管理员认证成功: user_id={user_id}')
        return await func(request, *args, **kwargs)
    
    return wrapper

