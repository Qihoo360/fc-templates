"""
Unsplash图片搜索提供者
"""

import asyncio
import logging
import time
from typing import List, Optional, Dict, Any
from pathlib import Path
import aiohttp
import hashlib

from ..models import (
    ImageInfo, ImageSearchRequest, ImageSearchResult, ImageOperationResult,
    ImageSourceType, ImageProvider, ImageFormat, ImageMetadata, ImageTag, ImageLicense
)
from .base import ImageSearchProvider

logger = logging.getLogger(__name__)


class UnsplashSearchProvider(ImageSearchProvider):
    """Unsplash图片搜索提供者"""
    
    def __init__(self, config: Dict[str, Any]):
        self.api_key = config.get('api_key', '')
        self.api_base = config.get('api_base', 'https://api.unsplash.com')
        self.per_page = config.get('per_page', 20)
        self.rate_limit_requests = config.get('rate_limit_requests', 50)
        self.rate_limit_window = config.get('rate_limit_window', 3600)  # 1小时
        self.timeout = config.get('timeout', 30)

        # 请求限制跟踪
        self._request_times = []

        # 设置enabled状态基于API密钥
        config_with_enabled = config.copy()
        config_with_enabled['enabled'] = bool(self.api_key)

        super().__init__(ImageProvider.UNSPLASH, config_with_enabled)
    
    async def search(self, request: ImageSearchRequest) -> ImageSearchResult:
        """搜索图片"""
        start_time = time.time()
        
        if not self.enabled:
            return ImageSearchResult(
                images=[], total_count=0, page=request.page,
                per_page=request.per_page, has_next=False, has_prev=False,
                search_time=0.0, provider=self.provider,
                error="Unsplash API key not configured"
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
            url = f"{self.api_base}/search/photos"
            params = {
                'client_id': self.api_key,
                'query': request.query,
                'page': request.page,
                'per_page': min(request.per_page, self.per_page),
                'order_by': 'relevant'
            }
            
            # 添加语言参数
            if hasattr(request, 'language') and request.language:
                # 将中文语言代码转换为Unsplash支持的格式
                lang_map = {
                    'zh': 'en',  # Unsplash主要支持英文，中文查询会自动处理
                    'zh-cn': 'en',
                    'zh-tw': 'en'
                }
                params['lang'] = lang_map.get(request.language.lower(), request.language.lower())
            
            # 发送请求
            logger.debug(f"Unsplash search: {url} with params: {params}")
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        logger.debug(f"Unsplash API returned {len(data.get('results', []))} results")
                        images = await self._parse_search_results(data)
                        logger.debug(f"Successfully parsed {len(images)} images")

                        total_count = data.get('total', 0)
                        total_pages = data.get('total_pages', 0)
                        current_page = request.page
                        
                        return ImageSearchResult(
                            images=images,
                            total_count=total_count,
                            page=current_page,
                            per_page=request.per_page,
                            has_next=current_page < total_pages,
                            has_prev=current_page > 1,
                            search_time=time.time() - start_time,
                            provider=self.provider
                        )
                    else:
                        error_msg = f"Unsplash API error: {response.status}"
                        if response.status == 401:
                            error_msg = "Invalid Unsplash API key"
                        elif response.status == 403:
                            error_msg = "Unsplash API rate limit exceeded"
                        
                        logger.error(f"Unsplash search failed: {error_msg}")
                        return ImageSearchResult(
                            images=[], total_count=0, page=request.page,
                            per_page=request.per_page, has_next=False, has_prev=False,
                            search_time=time.time() - start_time, provider=self.provider,
                            error=error_msg
                        )
                        
        except Exception as e:
            logger.error(f"Unsplash search failed: {e}")
            return ImageSearchResult(
                images=[], total_count=0, page=request.page,
                per_page=request.per_page, has_next=False, has_prev=False,
                search_time=time.time() - start_time, provider=self.provider,
                error=str(e)
            )
    
    async def _parse_search_results(self, data: Dict[str, Any]) -> List[ImageInfo]:
        """解析搜索结果"""
        images = []
        results = data.get('results', [])
        
        for item in results:
            try:
                image_info = await self._create_image_info_from_unsplash(item)
                if image_info:
                    images.append(image_info)
            except Exception as e:
                logger.warning(f"Failed to parse Unsplash image: {e}")
                continue
        
        return images
    
    async def _create_image_info_from_unsplash(self, item: Dict[str, Any]) -> Optional[ImageInfo]:
        """从Unsplash数据创建ImageInfo"""
        try:
            # 基本信息
            image_id = item.get('id', '')
            if not image_id:
                return None
            
            # 生成唯一的内部ID
            internal_id = hashlib.md5(f"unsplash_{image_id}".encode()).hexdigest()
            
            # 图片URLs
            urls = item.get('urls', {})
            original_url = urls.get('raw', urls.get('full', urls.get('regular', '')))

            # 如果仍然没有URL，记录错误并跳过
            if not original_url:
                logger.warning(f"Unsplash image {image_id} has no valid URL: {urls}")
                return None

            # 图片尺寸
            width = item.get('width', 0)
            height = item.get('height', 0)
            
            # 估算文件大小（基于尺寸的粗略估算）
            estimated_size = int(width * height * 0.3)  # 假设每像素0.3字节
            
            # 创建元数据
            metadata = ImageMetadata(
                width=width,
                height=height,
                format=ImageFormat.JPEG,  # Unsplash主要提供JPEG格式
                file_size=estimated_size,
                color_mode='RGB'
            )
            
            # 标签
            tags = []
            if 'tags' in item:
                for tag_item in item['tags']:
                    if isinstance(tag_item, dict) and 'title' in tag_item:
                        tags.append(ImageTag(name=tag_item['title'], category='unsplash'))
                    elif isinstance(tag_item, str):
                        tags.append(ImageTag(name=tag_item, category='unsplash'))
            
            # 用户信息
            user = item.get('user', {})
            author = user.get('name', '')
            author_url = user.get('links', {}).get('html', '')
            
            # 创建ImageInfo
            image_info = ImageInfo(
                image_id=internal_id,
                source_type=ImageSourceType.WEB_SEARCH,
                provider=ImageProvider.UNSPLASH,
                original_url=original_url,
                local_path='',  # 将在下载时设置
                filename=self._generate_meaningful_filename(item, image_id),
                title=item.get('alt_description', item.get('description', f'Unsplash Image {image_id}')),
                description=item.get('description', ''),
                alt_text=item.get('alt_description', ''),
                metadata=metadata,
                tags=tags,
                license=ImageLicense.UNSPLASH_LICENSE,
                author=author,
                author_url=author_url,
                source_url=item.get('links', {}).get('html', ''),
                created_at=time.time()
            )
            
            return image_info
            
        except Exception as e:
            logger.error(f"Failed to create ImageInfo from Unsplash data: {e}")
            return None
    
    async def get_image_details(self, image_id: str) -> Optional[ImageInfo]:
        """获取图片详细信息"""
        # 从image_id中提取Unsplash ID
        if image_id.startswith('unsplash_'):
            unsplash_id = image_id[9:]  # 移除'unsplash_'前缀
        else:
            unsplash_id = image_id
        
        try:
            url = f"{self.api_base}/photos/{unsplash_id}"
            params = {'client_id': self.api_key}
            
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return await self._create_image_info_from_unsplash(data)
                    else:
                        logger.error(f"Failed to get Unsplash image details: {response.status}")
                        return None
                        
        except Exception as e:
            logger.error(f"Failed to get Unsplash image details: {e}")
            return None
    
    async def download_image(self, image_info: ImageInfo, save_path: Path) -> ImageOperationResult:
        """下载图片到本地"""
        try:
            if not image_info.original_url:
                return ImageOperationResult(
                    success=False,
                    message="No download URL available",
                    error_code="no_url"
                )
            
            # 创建保存目录
            save_path.parent.mkdir(parents=True, exist_ok=True)
            
            # 下载图片
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=60)) as session:
                async with session.get(image_info.original_url) as response:
                    if response.status == 200:
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
                    else:
                        return ImageOperationResult(
                            success=False,
                            message=f"Download failed: HTTP {response.status}",
                            error_code="download_failed"
                        )
                        
        except Exception as e:
            logger.error(f"Failed to download Unsplash image: {e}")
            return ImageOperationResult(
                success=False,
                message=f"Download failed: {str(e)}",
                error_code="download_error"
            )
    
    def _check_rate_limit(self) -> bool:
        """检查请求限制"""
        current_time = time.time()
        
        # 清理过期的请求记录
        self._request_times = [
            t for t in self._request_times 
            if current_time - t < self.rate_limit_window
        ]
        
        # 检查是否超过限制
        if len(self._request_times) >= self.rate_limit_requests:
            return False
        
        # 记录当前请求时间
        self._request_times.append(current_time)
        return True

    def _generate_meaningful_filename(self, item: Dict[str, Any], image_id: str) -> str:
        """生成有意义的文件名"""
        try:
            # 获取描述或alt描述作为文件名基础
            alt_description = item.get('alt_description', '')
            description = item.get('description', '')

            # 优先使用alt_description，因为它通常更简洁
            base_text = alt_description or description

            if base_text:
                # 清理文本，只保留字母数字和空格
                clean_text = ''.join(c for c in base_text if c.isalnum() or c in ' -_')
                clean_text = clean_text.strip().replace(' ', '_')

                # 取前几个单词，限制长度
                words = clean_text.split('_')[:4]  # 最多4个单词
                if words and all(word for word in words):
                    base_name = '_'.join(words)

                    # 限制文件名长度
                    max_length = 50
                    if len(base_name) > max_length:
                        base_name = base_name[:max_length].rstrip('_')

                    return f"unsplash_{base_name}_{image_id}.jpg"

            # 如果没有有效描述，检查用户名
            user_name = item.get('user', {}).get('username', '')
            if user_name:
                clean_user = ''.join(c for c in user_name if c.isalnum() or c in '_')
                if clean_user:
                    return f"unsplash_by_{clean_user}_{image_id}.jpg"

            # 默认命名
            return f"unsplash_photo_{image_id}.jpg"

        except Exception as e:
            logger.warning(f"Failed to generate meaningful filename: {e}")
            # 回退到简单命名
            return f"unsplash_{image_id}.jpg"
