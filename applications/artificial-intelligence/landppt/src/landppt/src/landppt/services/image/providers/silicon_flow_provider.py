"""
SiliconFlow Kolors 图片生成提供者
"""

import asyncio
import logging
import time
from typing import Dict, Any, Optional, List
from pathlib import Path
import aiohttp
import json

from .base import ImageGenerationProvider
from ..models import (
    ImageInfo, ImageGenerationRequest, ImageOperationResult, 
    ImageProvider, ImageSourceType, ImageFormat, ImageMetadata, ImageTag
)

logger = logging.getLogger(__name__)


class SiliconFlowProvider(ImageGenerationProvider):
    """SiliconFlow Kolors 图片生成提供者"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(ImageProvider.SILICONFLOW, config)
        
        # API配置
        self.api_key = config.get('api_key')
        self.api_base = config.get('api_base', 'https://api.siliconflow.cn/v1')
        self.model = config.get('model', 'Kwai-Kolors/Kolors')
        self.default_size = config.get('default_size', '1024x1024')
        self.default_batch_size = config.get('default_batch_size', 1)
        self.default_steps = config.get('default_steps', 20)
        self.default_guidance_scale = config.get('default_guidance_scale', 7.5)
        
        # 速率限制
        self.rate_limit_requests = config.get('rate_limit_requests', 60)
        self.rate_limit_window = config.get('rate_limit_window', 60)
        
        # 请求历史（用于速率限制）
        self._request_history = []
        
        if not self.api_key:
            logger.warning("SiliconFlow API key not configured")
    
    async def generate(self, request: ImageGenerationRequest) -> ImageOperationResult:
        """生成图片"""
        if not self.api_key:
            return ImageOperationResult(
                success=False,
                message="SiliconFlow API key not configured",
                error_code="api_key_missing"
            )
        
        try:
            # 检查速率限制
            if not await self._check_rate_limit():
                return ImageOperationResult(
                    success=False,
                    message="Rate limit exceeded",
                    error_code="rate_limit_exceeded"
                )
            
            # 准备API请求
            api_request = self._prepare_api_request(request)
            
            # 调用SiliconFlow API
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.api_base}/images/generations",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json=api_request,
                    timeout=aiohttp.ClientTimeout(total=120)  # 2分钟超时
                ) as response:
                    
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"SiliconFlow API error {response.status}: {error_text}")
                        return ImageOperationResult(
                            success=False,
                            message=f"SiliconFlow API error: {response.status}",
                            error_code="api_error"
                        )
                    
                    result_data = await response.json()
            
            # 处理API响应
            return await self._process_api_response(result_data, request)
            
        except asyncio.TimeoutError:
            logger.error("SiliconFlow API request timeout")
            return ImageOperationResult(
                success=False,
                message="Request timeout",
                error_code="timeout"
            )
        except Exception as e:
            logger.error(f"SiliconFlow generation failed: {e}")
            return ImageOperationResult(
                success=False,
                message=f"Generation failed: {str(e)}",
                error_code="generation_error"
            )
    
    def _prepare_api_request(self, request: ImageGenerationRequest) -> Dict[str, Any]:
        """准备API请求"""
        # 构建尺寸字符串
        size = f"{request.width}x{request.height}"

        api_request = {
            "model": self.model,
            "prompt": request.prompt,
            "image_size": size,
            "batch_size": request.num_images or self.default_batch_size,
            "num_inference_steps": request.steps or self.default_steps,
            "guidance_scale": request.guidance_scale or self.default_guidance_scale
        }

        # 添加负面提示词（如果提供）
        if request.negative_prompt:
            api_request["negative_prompt"] = request.negative_prompt

        # 添加种子（如果提供）
        if request.seed:
            api_request["seed"] = request.seed

        return api_request
    
    async def _process_api_response(self,
                                  response_data: Dict[str, Any],
                                  request: ImageGenerationRequest) -> ImageOperationResult:
        """处理API响应"""
        try:
            # 根据SiliconFlow API文档，响应格式为 {"images": [{"url": "..."}], ...}
            if 'images' not in response_data or not response_data['images']:
                return ImageOperationResult(
                    success=False,
                    message="No image data in response",
                    error_code="no_data"
                )

            image_data = response_data['images'][0]
            image_url = image_data.get('url')

            if not image_url:
                return ImageOperationResult(
                    success=False,
                    message="No image URL in response",
                    error_code="no_url"
                )

            # 下载图片
            image_path, image_size = await self._download_image(image_url, request)

            # 创建图片信息
            image_info = self._create_image_info(
                image_path, image_size, request
            )

            return ImageOperationResult(
                success=True,
                message="Image generated successfully",
                image_info=image_info
            )

        except Exception as e:
            logger.error(f"Failed to process SiliconFlow response: {e}")
            return ImageOperationResult(
                success=False,
                message=f"Failed to process response: {str(e)}",
                error_code="response_processing_error"
            )
    
    async def _download_image(self, 
                            image_url: str, 
                            request: ImageGenerationRequest) -> tuple[Path, int]:
        """下载生成的图片"""
        # 生成文件名
        timestamp = int(time.time())
        filename = f"siliconflow_{timestamp}_{hash(request.prompt) % 10000}.png"
        
        # 创建保存路径
        save_dir = Path("temp/images_cache/ai_generated/siliconflow")
        save_dir.mkdir(parents=True, exist_ok=True)
        image_path = save_dir / filename
        
        # 下载图片
        async with aiohttp.ClientSession() as session:
            async with session.get(image_url) as response:
                if response.status != 200:
                    raise Exception(f"Failed to download image: {response.status}")
                
                image_data = await response.read()
                
                # 保存图片
                with open(image_path, 'wb') as f:
                    f.write(image_data)
                
                return image_path, len(image_data)
    
    def _create_image_info(self,
                          image_path: Path,
                          image_size: int,
                          request: ImageGenerationRequest) -> ImageInfo:
        """创建图片信息"""
        # 生成图片ID
        image_id = f"siliconflow_{int(time.time())}_{hash(request.prompt) % 10000}"

        # 使用请求中的尺寸
        width, height = request.width, request.height

        # 创建元数据
        metadata = ImageMetadata(
            width=width,
            height=height,
            format=ImageFormat.PNG,
            file_size=image_size,
            color_mode="RGB",
            has_transparency=True
        )

        # 创建标签（基于提示词）
        tags = self._generate_tags_from_prompt(request.prompt)

        return ImageInfo(
            image_id=image_id,
            filename=image_path.name,
            title=f"AI Generated: {request.prompt[:50]}...",
            description=f"Generated by SiliconFlow Kolors with prompt: {request.prompt}",
            alt_text=request.prompt,
            source_type=ImageSourceType.AI_GENERATED,
            provider=ImageProvider.SILICONFLOW,
            original_url="",
            local_path=str(image_path),
            metadata=metadata,
            tags=tags,
            keywords=self._extract_keywords_from_prompt(request.prompt),
            usage_count=0,
            created_at=time.time(),
            updated_at=time.time()
        )
    
    def _generate_tags_from_prompt(self, prompt: str) -> List[ImageTag]:
        """从提示词生成标签"""
        # 简单的关键词提取和标签生成
        keywords = prompt.lower().split()
        
        # 过滤常见词汇
        stop_words = {'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        keywords = [word for word in keywords if word not in stop_words and len(word) > 2]
        
        # 生成标签
        tags = []
        for i, keyword in enumerate(keywords[:10]):  # 最多10个标签
            confidence = max(0.5, 1.0 - i * 0.1)  # 递减的置信度
            tags.append(ImageTag(
                name=keyword,
                confidence=confidence,
                category="ai_generated"
            ))
        
        return tags
    
    def _extract_keywords_from_prompt(self, prompt: str) -> List[str]:
        """从提示词提取关键词"""
        # 简单的关键词提取
        words = prompt.lower().split()
        stop_words = {'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        keywords = [word for word in words if word not in stop_words and len(word) > 2]
        
        return keywords[:20]  # 最多20个关键词
    
    async def _check_rate_limit(self) -> bool:
        """检查速率限制"""
        current_time = time.time()
        
        # 清理过期的请求记录
        self._request_history = [
            req_time for req_time in self._request_history
            if current_time - req_time < self.rate_limit_window
        ]
        
        # 检查是否超过限制
        if len(self._request_history) >= self.rate_limit_requests:
            return False
        
        # 记录当前请求
        self._request_history.append(current_time)
        return True

    async def health_check(self) -> Dict[str, Any]:
        """健康检查"""
        if not self.api_key:
            return {
                'status': 'unhealthy',
                'message': 'API key not configured',
                'provider': self.provider.value
            }

        try:
            # 简单的API连通性检查
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.api_base}/models",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:

                    if response.status == 200:
                        return {
                            'status': 'healthy',
                            'message': 'API accessible',
                            'provider': self.provider.value,
                            'model': self.model,
                            'rate_limit_remaining': self.rate_limit_requests - len(self._request_history)
                        }
                    else:
                        return {
                            'status': 'unhealthy',
                            'message': f'API error: {response.status}',
                            'provider': self.provider.value
                        }

        except Exception as e:
            return {
                'status': 'unhealthy',
                'message': f'Health check failed: {str(e)}',
                'provider': self.provider.value
            }

    async def get_available_models(self) -> List[Dict[str, Any]]:
        """获取可用模型列表"""
        return [
            {
                'id': 'Kwai-Kolors/Kolors',
                'name': 'Kolors',
                'description': 'SiliconFlow Kolors model for high-quality image generation',
                'max_resolution': '1024x1024',
                'supported_sizes': ['512x512', '768x768', '1024x1024'],
                'default_steps': 20,
                'max_steps': 50
            }
        ]
