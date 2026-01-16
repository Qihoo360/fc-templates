"""
Pixabay图片搜索提供者
支持通过Pixabay API搜索免费图片和插图

API 限制：
- 频率限制：100 请求/60 秒
- per_page 范围：3-200
- 查询字符串最大长度：100 字符
- 缓存要求：24 小时
"""

import time
import logging
import aiohttp
from typing import Dict, Any, List, Optional
from pathlib import Path

from .base import ImageSearchProvider
from ..models import (
    ImageProvider, ImageSearchRequest, ImageSearchResult,
    ImageInfo, ImageTag, ImageMetadata, ImageOperationResult,
    ImageSourceType, ImageLicense, ImageFormat
)

logger = logging.getLogger(__name__)


class PixabaySearchProvider(ImageSearchProvider):
    """Pixabay图片搜索提供者"""
    
    def __init__(self, config: Dict[str, Any]):
        self.api_key = config.get('api_key', '')
        self.api_base = config.get('api_base', 'https://pixabay.com/api')
        self.per_page = config.get('per_page', 20)  # 默认20，最大200
        self.rate_limit_requests = config.get('rate_limit_requests', 100)  # 官方文档：100请求/60秒
        self.rate_limit_window = config.get('rate_limit_window', 60)  # 官方文档：60秒窗口
        self.timeout = config.get('timeout', 30)

        # 请求限制跟踪
        self._request_times = []

        # 设置enabled状态基于API密钥
        config_with_enabled = config.copy()
        config_with_enabled['enabled'] = bool(self.api_key)

        super().__init__(ImageProvider.PIXABAY, config_with_enabled)
    
    async def search(self, request: ImageSearchRequest) -> ImageSearchResult:
        """搜索图片"""
        start_time = time.time()
        
        if not self.enabled:
            return ImageSearchResult(
                images=[], total_count=0, page=request.page,
                per_page=request.per_page, has_next=False, has_prev=False,
                search_time=0.0, provider=self.provider,
                error="Pixabay API key not configured"
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
            
            # 构建搜索URL - 根据官方文档
            url = f"{self.api_base}/"

            # 确保查询字符串不超过100字符限制
            query = request.query[:100] if len(request.query) > 100 else request.query

            params = {
                'key': self.api_key,
                'q': query,
                'image_type': 'all',  # 支持 "all", "photo", "illustration", "vector"
                'orientation': 'all',  # 支持 "all", "horizontal", "vertical"
                'min_width': 640,
                'min_height': 480,
                'safesearch': 'true',
                'order': 'popular',  # 支持 "popular", "latest"
                'page': request.page,
                'per_page': max(3, min(request.per_page, min(self.per_page, 200))),  # API范围：3-200
                'pretty': 'false'
            }

            # 添加可选的搜索参数
            if hasattr(request, 'category') and request.category:
                # 官方支持的分类
                valid_categories = {
                    'backgrounds', 'fashion', 'nature', 'science', 'education',
                    'feelings', 'health', 'people', 'religion', 'places', 'animals',
                    'industry', 'computer', 'food', 'sports', 'transportation',
                    'travel', 'buildings', 'business', 'music'
                }
                if request.category in valid_categories:
                    params['category'] = request.category

            # 添加编辑精选过滤
            if hasattr(request, 'editors_choice') and request.editors_choice:
                params['editors_choice'] = 'true'
            
            # 添加语言参数 - 根据官方文档支持的语言代码
            if hasattr(request, 'language') and request.language:
                # Pixabay官方支持的语言代码
                supported_langs = {
                    'cs', 'da', 'de', 'en', 'es', 'fr', 'id', 'it', 'hu', 'nl', 'no',
                    'pl', 'pt', 'ro', 'sk', 'fi', 'sv', 'tr', 'vi', 'th', 'bg', 'ru',
                    'el', 'ja', 'ko', 'zh'
                }

                # 语言代码映射
                lang_map = {
                    'zh-cn': 'zh',
                    'zh-tw': 'zh',
                    'zh-hans': 'zh',
                    'zh-hant': 'zh'
                }

                lang_code = lang_map.get(request.language.lower(), request.language.lower())
                if lang_code in supported_langs:
                    params['lang'] = lang_code
                else:
                    params['lang'] = 'en'  # 默认英语
            
            # 发送请求
            logger.debug(f"Pixabay search: {url} with params: {params}")
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
                async with session.get(url, params=params) as response:
                    # 处理API响应头中的频率限制信息
                    self._process_rate_limit_headers(response.headers)

                    if response.status == 200:
                        data = await response.json()
                        logger.debug(f"Pixabay API returned {len(data.get('hits', []))} results")
                        images = await self._parse_search_results(data)
                        logger.debug(f"Successfully parsed {len(images)} images")

                        # 根据官方API响应格式解析
                        total_count = data.get('totalHits', 0)  # 可通过API访问的图片数量
                        total_available = data.get('total', 0)   # 总匹配数量
                        current_page = request.page
                        per_page = request.per_page
                        total_pages = (total_count + per_page - 1) // per_page if total_count > 0 else 0

                        return ImageSearchResult(
                            images=images,
                            total_count=total_count,
                            page=current_page,
                            per_page=per_page,
                            has_next=current_page < total_pages,
                            has_prev=current_page > 1,
                            search_time=time.time() - start_time,
                            provider=self.provider
                        )
                    elif response.status == 429:
                        # 频率限制超出
                        error_msg = "API rate limit exceeded"
                        logger.warning(f"Pixabay {error_msg}")
                        return ImageSearchResult(
                            images=[], total_count=0, page=request.page,
                            per_page=request.per_page, has_next=False, has_prev=False,
                            search_time=time.time() - start_time, provider=self.provider,
                            error=error_msg
                        )
                    else:
                        error_text = await response.text()
                        logger.error(f"Pixabay API error: {response.status} - {error_text}")
                        return ImageSearchResult(
                            images=[], total_count=0, page=request.page,
                            per_page=request.per_page, has_next=False, has_prev=False,
                            search_time=time.time() - start_time, provider=self.provider,
                            error=f"API error: {response.status}"
                        )
                        
        except Exception as e:
            logger.error(f"Pixabay search failed: {e}")
            return ImageSearchResult(
                images=[], total_count=0, page=request.page,
                per_page=request.per_page, has_next=False, has_prev=False,
                search_time=time.time() - start_time, provider=self.provider,
                error=str(e)
            )
    
    async def _parse_search_results(self, data: Dict[str, Any]) -> List[ImageInfo]:
        """解析搜索结果"""
        images = []
        hits = data.get('hits', [])
        
        for hit in hits:
            try:
                image_info = await self._create_image_info_from_pixabay(hit)
                if image_info:
                    images.append(image_info)
            except Exception as e:
                logger.warning(f"Failed to parse Pixabay image: {e}")
                continue
        
        return images
    
    async def _create_image_info_from_pixabay(self, hit: Dict[str, Any]) -> Optional[ImageInfo]:
        """从Pixabay API响应创建ImageInfo对象 - 根据官方API文档"""
        try:
            # 生成唯一的图片ID
            pixabay_id = str(hit.get('id', ''))
            image_id = f"pixabay_{pixabay_id}"

            # 根据官方文档获取图片URL
            # webformatURL: 中等尺寸图片，最大640px，24小时有效
            # largeImageURL: 大尺寸图片，最大1280px
            # fullHDURL: 全高清图片，最大1920px（需要完整API访问权限）
            # imageURL: 原始图片（需要完整API访问权限）
            original_url = (hit.get('webformatURL') or
                           hit.get('largeImageURL') or
                           hit.get('fullHDURL') or
                           hit.get('imageURL'))

            if not original_url:
                logger.warning(f"No valid URL found for Pixabay image {pixabay_id}")
                return None

            # 创建标签
            tags = []
            tags_str = hit.get('tags', '')
            if tags_str:
                tag_names = [tag.strip() for tag in tags_str.split(',') if tag.strip()]
                tags = [ImageTag(name=tag_name, confidence=1.0) for tag_name in tag_names]

            # 根据官方API响应创建元数据
            # 优先使用webformat尺寸，回退到原始尺寸
            width = hit.get('webformatWidth') or hit.get('imageWidth', 0)
            height = hit.get('webformatHeight') or hit.get('imageHeight', 0)
            file_size = hit.get('imageSize')  # 原始图片大小（字节）

            # 根据图片类型确定格式
            image_type = hit.get('type', 'photo')
            if image_type == 'vector':
                format_enum = ImageFormat.PNG  # SVG不在枚举中，使用PNG
                format_ext = 'png'
            elif image_type == 'illustration':
                format_enum = ImageFormat.PNG
                format_ext = 'png'
            else:
                format_enum = ImageFormat.JPG
                format_ext = 'jpg'

            metadata = ImageMetadata(
                width=width,
                height=height,
                file_size=file_size,
                format=format_enum,
                color_mode='RGB',
                has_transparency=(image_type in ['illustration', 'vector'])
            )
            
            # 生成有意义的文件名
            filename = self._generate_meaningful_filename(hit, pixabay_id, format_ext)

            # 创建ImageInfo对象 - 根据官方API响应字段和模型要求
            import time
            current_time = time.time()

            image_info = ImageInfo(
                image_id=image_id,
                source_type=ImageSourceType.WEB_SEARCH,  # 必需字段
                provider=self.provider,
                original_url=original_url,
                local_path="",  # 初始为空，下载后会更新
                filename=filename,  # 必需字段
                title=f"Pixabay Image {pixabay_id}",
                description=tags_str,
                alt_text=tags_str[:100] if tags_str else f"Pixabay image {pixabay_id}",
                metadata=metadata,
                tags=tags,
                license=ImageLicense.PIXABAY_LICENSE,  # 使用专门的Pixabay许可证
                license_info='Pixabay Content License',
                author=hit.get('user', 'Unknown'),
                source_url=hit.get('pageURL', ''),
                created_at=current_time,  # 必需字段，使用当前时间
                updated_at=current_time   # 必需字段，使用当前时间
            )
            
            return image_info

        except Exception as e:
            logger.error(f"Failed to create ImageInfo from Pixabay data: {e}")
            return None

    def _check_rate_limit(self) -> bool:
        """检查请求频率限制 - 根据官方文档：默认100请求/60秒"""
        current_time = time.time()

        # 根据官方文档，频率限制是60秒窗口，不是1小时
        rate_window = 60  # 60秒窗口

        # 清理过期的请求记录
        self._request_times = [
            req_time for req_time in self._request_times
            if current_time - req_time < rate_window
        ]

        # 检查是否超过限制（默认100请求/60秒）
        if len(self._request_times) >= self.rate_limit_requests:
            logger.warning(f"Pixabay rate limit exceeded: {len(self._request_times)}/{self.rate_limit_requests} in 60 seconds")
            return False

        # 记录当前请求时间
        self._request_times.append(current_time)
        return True

    def _process_rate_limit_headers(self, headers):
        """处理API响应头中的频率限制信息"""
        try:
            # 根据官方文档，响应头包含频率限制信息
            rate_limit = headers.get('X-RateLimit-Limit')
            rate_remaining = headers.get('X-RateLimit-Remaining')
            rate_reset = headers.get('X-RateLimit-Reset')

            if rate_limit:
                logger.debug(f"Pixabay rate limit: {rate_remaining}/{rate_limit}, reset in {rate_reset}s")

            # 如果剩余请求数很少，记录警告
            if rate_remaining and int(rate_remaining) < 10:
                logger.warning(f"Pixabay API rate limit nearly exceeded: {rate_remaining} requests remaining")

        except Exception as e:
            logger.debug(f"Failed to process rate limit headers: {e}")

    def _generate_meaningful_filename(self, hit: Dict[str, Any], pixabay_id: str, format_ext: str) -> str:
        """生成有意义的文件名"""
        try:
            # 获取标签作为文件名基础
            tags = hit.get('tags', '')
            if tags:
                # 取前3个标签，清理和格式化
                tag_list = [tag.strip() for tag in tags.split(',')[:3] if tag.strip()]
                if tag_list:
                    # 清理标签中的特殊字符，只保留字母数字和空格
                    clean_tags = []
                    for tag in tag_list:
                        # 移除特殊字符，保留字母、数字、空格和连字符
                        clean_tag = ''.join(c for c in tag if c.isalnum() or c in ' -_')
                        clean_tag = clean_tag.strip().replace(' ', '_')
                        if clean_tag and len(clean_tag) > 1:
                            clean_tags.append(clean_tag)

                    if clean_tags:
                        # 组合标签，限制总长度
                        base_name = '_'.join(clean_tags)
                        # 限制文件名长度（不包括扩展名）
                        max_length = 50
                        if len(base_name) > max_length:
                            base_name = base_name[:max_length].rstrip('_')

                        # 添加图片类型和ID
                        image_type = hit.get('type', 'photo')
                        return f"pixabay_{image_type}_{base_name}_{pixabay_id}.{format_ext}"

            # 如果没有有效标签，使用默认命名
            image_type = hit.get('type', 'photo')
            return f"pixabay_{image_type}_{pixabay_id}.{format_ext}"

        except Exception as e:
            logger.warning(f"Failed to generate meaningful filename: {e}")
            # 回退到简单命名
            return f"pixabay_{pixabay_id}.{format_ext}"

    async def get_image_details(self, image_id: str) -> Optional[ImageInfo]:
        """获取图片详细信息"""
        # 从image_id中提取Pixabay ID
        if image_id.startswith('pixabay_'):
            pixabay_id = image_id[8:]  # 移除'pixabay_'前缀
        else:
            pixabay_id = image_id

        try:
            # Pixabay没有单独的图片详情API，需要通过搜索来获取
            # 这里返回None，表示不支持详情获取
            logger.warning("Pixabay provider does not support individual image details")
            return None

        except Exception as e:
            logger.error(f"Failed to get Pixabay image details: {e}")
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
            logger.error(f"Failed to download Pixabay image: {e}")
            return ImageOperationResult(
                success=False,
                message=f"Download error: {str(e)}",
                error_code="download_error"
            )
