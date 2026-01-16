"""
SearXNG图片搜索提供者
"""

import asyncio
import logging
import time
import aiohttp
from typing import Dict, Any, List, Optional
from pathlib import Path
import hashlib
import re

from ..models import (
    ImageInfo, ImageSearchRequest, ImageSearchResult, ImageOperationResult,
    ImageProvider, ImageSourceType, ImageMetadata, ImageLicense
)
from .base import ImageSearchProvider

logger = logging.getLogger(__name__)


class SearXNGSearchProvider(ImageSearchProvider):
    """SearXNG图片搜索提供者"""
    
    def __init__(self, config: Dict[str, Any]):
        self.host = config.get('host', '')
        self.per_page = config.get('per_page', 20)
        self.rate_limit_requests = config.get('rate_limit_requests', 60)
        self.rate_limit_window = config.get('rate_limit_window', 60)  # 1分钟
        self.timeout = config.get('timeout', 30)
        self.language = config.get('language', 'auto')
        self.theme = config.get('theme', 'simple')

        # 请求限制跟踪
        self._request_times = []

        # 设置enabled状态基于host配置
        config_with_enabled = config.copy()
        config_with_enabled['enabled'] = bool(self.host and self.host.strip())

        super().__init__(ImageProvider.SEARXNG, config_with_enabled)
    
    async def search(self, request: ImageSearchRequest) -> ImageSearchResult:
        """搜索图片"""
        start_time = time.time()
        
        if not self.enabled:
            return ImageSearchResult(
                images=[], total_count=0, page=request.page,
                per_page=request.per_page, has_next=False, has_prev=False,
                search_time=0.0, provider=self.provider,
                error="SearXNG host not configured"
            )
        
        try:
            # 检查请求限制
            if not self._check_rate_limit():
                return ImageSearchResult(
                    images=[], total_count=0, page=request.page,
                    per_page=request.per_page, has_next=False, has_prev=False,
                    search_time=time.time() - start_time, provider=self.provider,
                    error="Rate limit exceeded"
                )
            
            # 构建搜索URL
            search_url = f"{self.host.rstrip('/')}/search"
            
            # 构建查询参数
            params = {
                'q': request.query,
                'categories': 'images',
                'language': self.language,
                'theme': self.theme,
                'format': 'json'
            }
            
            # 记录请求时间
            self._request_times.append(time.time())
            
            # 发送请求
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
                async with session.get(search_url, params=params) as response:
                    if response.status != 200:
                        error_msg = f"SearXNG API returned status {response.status}"
                        logger.error(error_msg)
                        return ImageSearchResult(
                            images=[], total_count=0, page=request.page,
                            per_page=request.per_page, has_next=False, has_prev=False,
                            search_time=time.time() - start_time, provider=self.provider,
                            error=error_msg
                        )
                    
                    data = await response.json()
            
            # 解析搜索结果
            images = []
            results = data.get('results', [])
            
            # 计算分页
            start_index = (request.page - 1) * request.per_page
            end_index = start_index + request.per_page
            page_results = results[start_index:end_index]
            
            for result in page_results:
                try:
                    image_info = await self._parse_search_result(result)
                    if image_info:
                        images.append(image_info)
                except Exception as e:
                    logger.warning(f"Failed to parse SearXNG result: {e}")
                    continue
            
            # 计算分页信息
            total_count = len(results)
            has_next = end_index < total_count
            has_prev = request.page > 1
            
            return ImageSearchResult(
                images=images,
                total_count=total_count,
                page=request.page,
                per_page=request.per_page,
                has_next=has_next,
                has_prev=has_prev,
                search_time=time.time() - start_time,
                provider=self.provider
            )
            
        except asyncio.TimeoutError:
            error_msg = "SearXNG search request timed out"
            logger.error(error_msg)
            return ImageSearchResult(
                images=[], total_count=0, page=request.page,
                per_page=request.per_page, has_next=False, has_prev=False,
                search_time=time.time() - start_time, provider=self.provider,
                error=error_msg
            )
        except Exception as e:
            error_msg = f"SearXNG search failed: {str(e)}"
            logger.error(error_msg)
            return ImageSearchResult(
                images=[], total_count=0, page=request.page,
                per_page=request.per_page, has_next=False, has_prev=False,
                search_time=time.time() - start_time, provider=self.provider,
                error=error_msg
            )
    
    async def _parse_search_result(self, result: Dict[str, Any]) -> Optional[ImageInfo]:
        """解析搜索结果为ImageInfo对象"""
        try:
            # 获取图片URL
            img_src = result.get('img_src')
            if not img_src:
                return None
            
            # 生成唯一ID
            image_id = hashlib.md5(img_src.encode()).hexdigest()
            
            # 解析分辨率
            resolution = result.get('resolution', '')
            width, height = self._parse_resolution(resolution)

            # 解析文件大小
            filesize_str = result.get('filesize', '')
            file_size = self._parse_filesize(filesize_str)

            # 解析图片格式，确保是有效的格式
            img_format = result.get('img_format', 'jpg').lower()
            valid_formats = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'bmp', 'tiff']
            if img_format not in valid_formats:
                img_format = 'jpg'  # 默认为jpg

            # 创建元数据
            metadata = ImageMetadata(
                width=width,
                height=height,
                format=img_format,
                file_size=file_size,
                color_mode='RGB',
                has_transparency=False
            )
            
            # 创建ImageInfo对象
            image_info = ImageInfo(
                image_id=image_id,
                source_type=ImageSourceType.WEB_SEARCH,
                provider=self.provider,
                original_url=img_src,
                local_path='',  # 将在下载时设置
                filename=f"searxng_{image_id}.{img_format}",
                title=result.get('title', ''),
                description=result.get('content', ''),
                metadata=metadata,
                license=ImageLicense.UNKNOWN,
                author=result.get('source', ''),
                source_url=result.get('url', img_src)
            )
            
            return image_info
            
        except Exception as e:
            logger.error(f"Failed to parse SearXNG result: {e}")
            return None
    
    def _parse_resolution(self, resolution: str) -> tuple:
        """解析分辨率字符串"""
        if not resolution:
            return 0, 0

        # 匹配 "1280x720" 或 "1280×720" 格式
        match = re.match(r'(\d+)[x×](\d+)', resolution)
        if match:
            return int(match.group(1)), int(match.group(2))

        return 0, 0
    
    def _parse_filesize(self, filesize_str: str) -> int:
        """解析文件大小字符串"""
        if not filesize_str:
            return 0
        
        # 匹配 "113.58 KB" 格式
        match = re.match(r'([\d.]+)\s*(KB|MB|GB)', filesize_str.upper())
        if match:
            size = float(match.group(1))
            unit = match.group(2)
            
            if unit == 'KB':
                return int(size * 1024)
            elif unit == 'MB':
                return int(size * 1024 * 1024)
            elif unit == 'GB':
                return int(size * 1024 * 1024 * 1024)
        
        return 0
    
    def _check_rate_limit(self) -> bool:
        """检查请求速率限制"""
        current_time = time.time()
        
        # 清理过期的请求记录
        self._request_times = [
            req_time for req_time in self._request_times
            if current_time - req_time < self.rate_limit_window
        ]
        
        # 检查是否超过限制
        return len(self._request_times) < self.rate_limit_requests
    
    async def get_image_details(self, image_id: str) -> Optional[ImageInfo]:
        """获取图片详细信息"""
        # SearXNG不支持通过ID获取详细信息
        logger.warning("SearXNG does not support getting image details by ID")
        return None
    
    async def download_image(self, image_info: ImageInfo, save_path: Path) -> ImageOperationResult:
        """下载图片到本地"""
        try:
            if not image_info.original_url:
                return ImageOperationResult(
                    success=False,
                    message="No original URL available for download"
                )
            
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
                async with session.get(image_info.original_url) as response:
                    if response.status != 200:
                        return ImageOperationResult(
                            success=False,
                            message=f"Failed to download image: HTTP {response.status}"
                        )
                    
                    # 确保目录存在
                    save_path.parent.mkdir(parents=True, exist_ok=True)
                    
                    # 保存文件
                    with open(save_path, 'wb') as f:
                        async for chunk in response.content.iter_chunked(8192):
                            f.write(chunk)
                    
                    # 更新本地路径
                    image_info.local_path = str(save_path)
                    
                    return ImageOperationResult(
                        success=True,
                        message="Image downloaded successfully",
                        image_info=image_info
                    )
                    
        except Exception as e:
            error_msg = f"Failed to download image from SearXNG: {str(e)}"
            logger.error(error_msg)
            return ImageOperationResult(
                success=False,
                message=error_msg
            )
