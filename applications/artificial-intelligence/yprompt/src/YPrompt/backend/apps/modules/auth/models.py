"""
认证模块数据模型
用于OpenAPI文档生成
"""
from sanic_ext import openapi


# 登录请求模型
@openapi.component
class LoginRequest:
    code: str = openapi.String(description="飞书授权码", required=True)


# 登录响应 - 用户信息
@openapi.component
class UserInfo:
    id: int = openapi.Integer(description="用户ID")
    open_id: str = openapi.String(description="飞书open_id")
    union_id: str = openapi.String(description="飞书union_id")
    name: str = openapi.String(description="用户姓名")
    avatar: str = openapi.String(description="用户头像URL")
    email: str = openapi.String(description="用户邮箱")
    mobile: str = openapi.String(description="用户手机号")
    last_login_time: str = openapi.String(description="最后登录时间")


# 登录响应 - 数据部分
@openapi.component
class LoginData:
    token: str = openapi.String(description="JWT Token")
    user: UserInfo = openapi.Object(UserInfo, description="用户信息")


# 登录响应
@openapi.component
class LoginResponse:
    code: int = openapi.Integer(description="状态码", default=200)
    message: str = openapi.String(description="响应消息", default="登录成功")
    data: LoginData = openapi.Object(LoginData, description="响应数据")


# Token刷新响应
@openapi.component
class RefreshTokenData:
    token: str = openapi.String(description="新的JWT Token")


@openapi.component
class RefreshTokenResponse:
    code: int = openapi.Integer(description="状态码", default=200)
    message: str = openapi.String(description="响应消息", default="刷新成功")
    data: RefreshTokenData = openapi.Object(RefreshTokenData, description="响应数据")


# 通用错误响应
@openapi.component
class ErrorResponse:
    code: int = openapi.Integer(description="错误码")
    message: str = openapi.String(description="错误消息")


# 通用成功响应
@openapi.component
class SuccessResponse:
    code: int = openapi.Integer(description="状态码", default=200)
    message: str = openapi.String(description="响应消息")
    data: dict = openapi.Object(description="响应数据")

