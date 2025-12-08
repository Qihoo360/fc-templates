"""
版本管理数据模型
用于OpenAPI文档生成
"""
from sanic_ext import openapi


# 创建版本请求
@openapi.component
class CreateVersionRequest:
    change_type: str = openapi.String(description="变更类型: major/minor/patch", required=True)
    change_summary: str = openapi.String(description="变更摘要（简短描述）", required=True)
    change_log: str = openapi.String(description="详细变更说明（可选）")
    version_tag: str = openapi.String(description="版本标签（可选）: draft/beta/stable/production")


# 版本信息（列表项）
@openapi.component
class VersionListItem:
    id: int = openapi.Integer(description="版本ID")
    version_number: str = openapi.String(description="版本号")
    version_tag: str = openapi.String(description="版本标签")
    version_type: str = openapi.String(description="版本类型")
    change_summary: str = openapi.String(description="变更摘要")
    created_by: int = openapi.Integer(description="创建者ID")
    author_name: str = openapi.String(description="作者姓名")
    author_avatar: str = openapi.String(description="作者头像")
    content_size: int = openapi.Integer(description="内容大小（字节）")
    use_count: int = openapi.Integer(description="使用次数")
    create_time: str = openapi.String(description="创建时间")


# 版本列表响应
@openapi.component
class VersionListData:
    total: int = openapi.Integer(description="总版本数")
    page: int = openapi.Integer(description="当前页")
    limit: int = openapi.Integer(description="每页数量")
    items: list = openapi.Array(VersionListItem, description="版本列表")


@openapi.component
class VersionListResponse:
    code: int = openapi.Integer(description="状态码", default=200)
    data: VersionListData = openapi.Object(VersionListData, description="响应数据")


# 创建版本响应
@openapi.component
class CreateVersionData:
    version_id: int = openapi.Integer(description="版本ID")
    version_number: str = openapi.String(description="版本号")
    create_time: str = openapi.String(description="创建时间")


@openapi.component
class CreateVersionResponse:
    code: int = openapi.Integer(description="状态码", default=200)
    message: str = openapi.String(description="响应消息", default="版本创建成功")
    data: CreateVersionData = openapi.Object(CreateVersionData, description="响应数据")


# 版本详情
@openapi.component
class VersionDetail:
    id: int = openapi.Integer(description="版本ID")
    prompt_id: int = openapi.Integer(description="提示词ID")
    version_number: str = openapi.String(description="版本号")
    version_tag: str = openapi.String(description="版本标签")
    version_type: str = openapi.String(description="版本类型")
    
    # 内容
    title: str = openapi.String(description="标题")
    description: str = openapi.String(description="描述")
    final_prompt: str = openapi.String(description="最终提示词")
    
    # 元数据
    change_log: str = openapi.String(description="变更说明")
    change_summary: str = openapi.String(description="变更摘要")
    change_type: str = openapi.String(description="变更类型")
    parent_version_id: int = openapi.Integer(description="父版本ID")
    
    # 作者
    created_by: int = openapi.Integer(description="创建者ID")
    author_name: str = openapi.String(description="作者姓名")
    author_avatar: str = openapi.String(description="作者头像")
    
    # 统计
    use_count: int = openapi.Integer(description="使用次数")
    content_size: int = openapi.Integer(description="内容大小")
    
    create_time: str = openapi.String(description="创建时间")


@openapi.component
class VersionDetailResponse:
    code: int = openapi.Integer(description="状态码", default=200)
    data: VersionDetail = openapi.Object(VersionDetail, description="版本详情")


# 版本对比
@openapi.component
class VersionCompareData:
    from_version: dict = openapi.Object({}, description="源版本信息")
    to_version: dict = openapi.Object({}, description="目标版本信息")
    changes: dict = openapi.Object({}, description="变更标记")
    diff: dict = openapi.Object({}, description="差异详情")


@openapi.component
class VersionCompareResponse:
    code: int = openapi.Integer(description="状态码", default=200)
    data: VersionCompareData = openapi.Object(VersionCompareData, description="对比数据")


# 回滚请求
@openapi.component
class RollbackRequest:
    change_summary: str = openapi.String(description="回滚说明（可选）")


# 回滚响应
@openapi.component
class RollbackData:
    new_version: str = openapi.String(description="新版本号")
    rollback_to_version: str = openapi.String(description="回滚到的版本号")


@openapi.component
class RollbackResponse:
    code: int = openapi.Integer(description="状态码", default=200)
    message: str = openapi.String(description="响应消息", default="回滚成功")
    data: RollbackData = openapi.Object(RollbackData, description="响应数据")


# 更新标签请求
@openapi.component
class UpdateTagRequest:
    version_tag: str = openapi.String(description="版本标签: draft/beta/stable/production/archived", required=True)


# 通用成功响应
@openapi.component
class SuccessResponse:
    code: int = openapi.Integer(description="状态码", default=200)
    message: str = openapi.String(description="响应消息")


# 错误响应
@openapi.component
class ErrorResponse:
    code: int = openapi.Integer(description="错误码")
    message: str = openapi.String(description="错误消息")

