"""
PPT幻灯片图片信息数据模型
支持多图片信息的数据结构，包含图片来源、用途、内容描述、绝对地址等信息
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum


class ImageSource(Enum):
    """图片来源枚举"""
    LOCAL = "local"          # 本地图床
    NETWORK = "network"      # 网络搜索
    AI_GENERATED = "ai_generated"  # AI生成


class ImagePurpose(Enum):
    """图片用途枚举"""
    DECORATION = "decoration"        # 装饰性图片
    ILLUSTRATION = "illustration"    # 说明性图片
    BACKGROUND = "background"        # 背景图片
    ICON = "icon"                   # 图标
    CHART_SUPPORT = "chart_support" # 图表辅助
    CONTENT_VISUAL = "content_visual" # 内容可视化


@dataclass
class SlideImageInfo:
    """单个图片信息"""
    image_id: str                    # 图片ID
    absolute_url: str                # 绝对地址URL
    source: ImageSource              # 图片来源
    purpose: ImagePurpose            # 图片用途
    content_description: str         # 内容描述
    search_keywords: Optional[str] = None    # 搜索关键词（用于本地/网络搜索）
    generation_prompt: Optional[str] = None  # 生成提示词（用于AI生成）
    width: Optional[int] = None      # 图片宽度
    height: Optional[int] = None     # 图片高度
    file_size: Optional[int] = None  # 文件大小
    format: Optional[str] = None     # 图片格式
    alt_text: str = ""               # 替代文本
    title: str = ""                  # 图片标题
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            "image_id": self.image_id,
            "absolute_url": self.absolute_url,
            "source": self.source.value,
            "purpose": self.purpose.value,
            "content_description": self.content_description,
            "search_keywords": self.search_keywords,
            "generation_prompt": self.generation_prompt,
            "width": self.width,
            "height": self.height,
            "file_size": self.file_size,
            "format": self.format,
            "alt_text": self.alt_text,
            "title": self.title
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SlideImageInfo':
        """从字典创建实例"""
        return cls(
            image_id=data["image_id"],
            absolute_url=data["absolute_url"],
            source=ImageSource(data["source"]),
            purpose=ImagePurpose(data["purpose"]),
            content_description=data["content_description"],
            search_keywords=data.get("search_keywords"),
            generation_prompt=data.get("generation_prompt"),
            width=data.get("width"),
            height=data.get("height"),
            file_size=data.get("file_size"),
            format=data.get("format"),
            alt_text=data.get("alt_text", ""),
            title=data.get("title", "")
        )


@dataclass
class SlideImagesCollection:
    """幻灯片图片集合"""
    page_number: int                 # 页码
    images: List[SlideImageInfo]     # 图片列表
    total_count: int = 0             # 总图片数量
    local_count: int = 0             # 本地图片数量
    network_count: int = 0           # 网络图片数量
    ai_generated_count: int = 0      # AI生成图片数量
    
    def __post_init__(self):
        """初始化后处理，计算各类型图片数量"""
        self.total_count = len(self.images)
        self.local_count = sum(1 for img in self.images if img.source == ImageSource.LOCAL)
        self.network_count = sum(1 for img in self.images if img.source == ImageSource.NETWORK)
        self.ai_generated_count = sum(1 for img in self.images if img.source == ImageSource.AI_GENERATED)
    
    def add_image(self, image_info: SlideImageInfo):
        """添加图片"""
        self.images.append(image_info)
        self.__post_init__()  # 重新计算数量
    
    def get_images_by_source(self, source: ImageSource) -> List[SlideImageInfo]:
        """根据来源获取图片"""
        return [img for img in self.images if img.source == source]
    
    def get_images_by_purpose(self, purpose: ImagePurpose) -> List[SlideImageInfo]:
        """根据用途获取图片"""
        return [img for img in self.images if img.purpose == purpose]
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            "page_number": self.page_number,
            "total_count": self.total_count,
            "local_count": self.local_count,
            "network_count": self.network_count,
            "ai_generated_count": self.ai_generated_count,
            "images": [img.to_dict() for img in self.images]
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SlideImagesCollection':
        """从字典创建实例"""
        images = [SlideImageInfo.from_dict(img_data) for img_data in data.get("images", [])]
        return cls(
            page_number=data["page_number"],
            images=images
        )
    
    def get_summary_for_ai(self) -> str:
        """获取用于AI参考的图片摘要信息"""
        if not self.images:
            return "本页面无图片"

        summary_parts = [
            f"本页面共有{self.total_count}张图片："
        ]

        def _format_image_with_metadata(img: SlideImageInfo) -> str:
            """格式化图片信息，包含元数据"""
            # 基本描述
            desc = f"{img.content_description}({img.purpose.value})"

            # 添加尺寸信息
            if img.width and img.height:
                desc += f" [尺寸: {img.width}x{img.height}px]"

            # 添加文件大小信息
            if img.file_size:
                if img.file_size < 1024:
                    size_str = f"{img.file_size}B"
                elif img.file_size < 1024 * 1024:
                    size_str = f"{img.file_size / 1024:.1f}KB"
                else:
                    size_str = f"{img.file_size / (1024 * 1024):.1f}MB"
                desc += f" [大小: {size_str}]"

            # 添加格式信息
            if img.format:
                desc += f" [格式: {img.format.upper()}]"

            return desc

        if self.local_count > 0:
            local_images = self.get_images_by_source(ImageSource.LOCAL)
            local_desc = ", ".join([_format_image_with_metadata(img) for img in local_images])
            summary_parts.append(f"- 本地图片{self.local_count}张: {local_desc}")

        if self.network_count > 0:
            network_images = self.get_images_by_source(ImageSource.NETWORK)
            network_desc = ", ".join([_format_image_with_metadata(img) for img in network_images])
            summary_parts.append(f"- 网络图片{self.network_count}张: {network_desc}")

        if self.ai_generated_count > 0:
            ai_images = self.get_images_by_source(ImageSource.AI_GENERATED)
            ai_desc = ", ".join([_format_image_with_metadata(img) for img in ai_images])
            summary_parts.append(f"- AI生成图片{self.ai_generated_count}张: {ai_desc}")

        # 添加详细的图片信息，包含元数据
        summary_parts.append("\n详细图片信息：")
        for i, img in enumerate(self.images, 1):
            # 构建详细信息
            details = []
            details.append(f"地址: {img.absolute_url}")
            details.append(f"描述: {img.content_description}")
            details.append(f"用途: {img.purpose.value}")

            if img.width and img.height:
                details.append(f"尺寸: {img.width}x{img.height}px")

            if img.file_size:
                if img.file_size < 1024:
                    size_str = f"{img.file_size}B"
                elif img.file_size < 1024 * 1024:
                    size_str = f"{img.file_size / 1024:.1f}KB"
                else:
                    size_str = f"{img.file_size / (1024 * 1024):.1f}MB"
                details.append(f"大小: {size_str}")

            if img.format:
                details.append(f"格式: {img.format.upper()}")

            if img.title:
                details.append(f"标题: {img.title}")

            if img.alt_text:
                details.append(f"替代文本: {img.alt_text}")

            summary_parts.append(f"{i}. {' | '.join(details)}")

        return "\n".join(summary_parts)


@dataclass
class ImageRequirement:
    """图片需求信息"""
    source: ImageSource              # 图片来源
    count: int                       # 需要数量
    purpose: ImagePurpose            # 图片用途
    description: str                 # 需求描述
    priority: int = 1                # 优先级 (1-5, 5最高)
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            "source": self.source.value,
            "count": self.count,
            "purpose": self.purpose.value,
            "description": self.description,
            "priority": self.priority
        }


@dataclass
class SlideImageRequirements:
    """幻灯片图片需求集合"""
    page_number: int                 # 页码
    requirements: List[ImageRequirement]  # 需求列表
    total_images_needed: int = 0     # 总需求图片数量
    
    def __post_init__(self):
        """初始化后处理"""
        self.total_images_needed = sum(req.count for req in self.requirements)
    
    def add_requirement(self, requirement: ImageRequirement):
        """添加需求"""
        self.requirements.append(requirement)
        self.__post_init__()
    
    def get_requirements_by_source(self, source: ImageSource) -> List[ImageRequirement]:
        """根据来源获取需求"""
        return [req for req in self.requirements if req.source == source]
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            "page_number": self.page_number,
            "total_images_needed": self.total_images_needed,
            "requirements": [req.to_dict() for req in self.requirements]
        }
