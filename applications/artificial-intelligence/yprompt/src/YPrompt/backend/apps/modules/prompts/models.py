"""
提示词模块数据模型
用于OpenAPI文档生成
"""
from sanic_ext import openapi


# 保存提示词请求
@openapi.component
class SavePromptRequest:
    title: str = openapi.String(description="提示词标题", required=True)
    description: str = openapi.String(description="提示词描述")
    requirement_report: str = openapi.String(description="需求报告")
    thinking_points: list = openapi.Array(openapi.String(), description="关键指令数组")
    initial_prompt: str = openapi.String(description="初始提示词")
    advice: list = openapi.Array(openapi.String(), description="优化建议数组")
    final_prompt: str = openapi.String(description="最终提示词", required=True)
    language: str = openapi.String(description="语言 zh/en", default="zh")
    format: str = openapi.String(description="格式 markdown/xml", default="markdown")
    prompt_type: str = openapi.String(description="提示词类型 system/user", default="system")
    tags: list = openapi.Array(openapi.String(), description="标签数组")


# 提示词信息(完整版 - 修复字段缺失问题)
@openapi.component
class PromptInfo:
    id: int = openapi.Integer(description="提示词ID")
    user_id: int = openapi.Integer(description="用户ID")
    title: str = openapi.String(description="标题")
    description: str = openapi.String(description="描述")
    requirement_report: str = openapi.String(description="需求报告")
    thinking_points: str = openapi.String(description="关键指令(JSON)")
    initial_prompt: str = openapi.String(description="初始提示词")
    advice: str = openapi.String(description="优化建议(JSON)")
    final_prompt: str = openapi.String(description="最终提示词")
    language: str = openapi.String(description="语言")
    format: str = openapi.String(description="格式")
    prompt_type: str = openapi.String(description="提示词类型")
    is_favorite: int = openapi.Integer(description="是否收藏")
    is_public: int = openapi.Integer(description="是否公开")
    view_count: int = openapi.Integer(description="查看次数")
    use_count: int = openapi.Integer(description="使用次数")
    tags: str = openapi.String(description="标签(逗号分隔)")
    current_version: str = openapi.String(description="当前版本号")
    total_versions: int = openapi.Integer(description="总版本数")
    last_version_time: str = openapi.String(description="最后版本时间")
    create_time: str = openapi.String(description="创建时间")
    update_time: str = openapi.String(description="更新时间")


# 提示词列表项(完整版 - 修复字段缺失问题)
@openapi.component
class PromptListItem:
    id: int = openapi.Integer(description="提示词ID")
    title: str = openapi.String(description="标题")
    description: str = openapi.String(description="描述")
    language: str = openapi.String(description="语言")
    format: str = openapi.String(description="格式")
    prompt_type: str = openapi.String(description="提示词类型")
    is_favorite: int = openapi.Integer(description="是否收藏")
    is_public: int = openapi.Integer(description="是否公开")
    tags: list = openapi.Array(openapi.String(), description="标签数组")
    view_count: int = openapi.Integer(description="查看次数")
    use_count: int = openapi.Integer(description="使用次数")
    current_version: str = openapi.String(description="当前版本号")
    total_versions: int = openapi.Integer(description="总版本数")
    last_version_time: str = openapi.String(description="最后版本时间")
    create_time: str = openapi.String(description="创建时间")
    update_time: str = openapi.String(description="更新时间")


# 提示词列表响应
@openapi.component
class PromptListData:
    total: int = openapi.Integer(description="总数")
    page: int = openapi.Integer(description="当前页")
    limit: int = openapi.Integer(description="每页数量")
    items: list = openapi.Array(PromptListItem, description="提示词列表")


@openapi.component
class PromptListResponse:
    code: int = openapi.Integer(description="状态码", default=200)
    data: PromptListData = openapi.Object(PromptListData, description="响应数据")


# 保存成功响应
@openapi.component
class SavePromptData:
    id: int = openapi.Integer(description="提示词ID")
    create_time: str = openapi.String(description="创建时间")


@openapi.component
class SavePromptResponse:
    code: int = openapi.Integer(description="状态码", default=200)
    message: str = openapi.String(description="响应消息", default="保存成功")
    data: SavePromptData = openapi.Object(SavePromptData, description="响应数据")


# 收藏请求
@openapi.component
class FavoriteRequest:
    is_favorite: bool = openapi.Boolean(description="是否收藏", required=True)


# 通用成功响应
@openapi.component
class SuccessResponse:
    code: int = openapi.Integer(description="状态码", default=200)
    message: str = openapi.String(description="响应消息")


# 提示词详情响应
@openapi.component
class PromptDetailResponse:
    code: int = openapi.Integer(description="状态码", default=200)
    data: PromptInfo = openapi.Object(PromptInfo, description="提示词详情")


# 错误响应
@openapi.component
class ErrorResponse:
    code: int = openapi.Integer(description="错误码")
    message: str = openapi.String(description="错误消息")
