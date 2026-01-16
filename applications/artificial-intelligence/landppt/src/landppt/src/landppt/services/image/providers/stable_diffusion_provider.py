"""
Stable Diffusion 图片生成提供者
"""

import asyncio
import logging
import time
import base64
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


class StableDiffusionProvider(ImageGenerationProvider):
    """Stable Diffusion 图片生成提供者"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(ImageProvider.STABLE_DIFFUSION, config)
        
        # API配置
        self.api_key = config.get('api_key')
        self.api_base = config.get('api_base', 'https://api.stability.ai/v1')
        self.engine_id = config.get('engine_id', 'stable-diffusion-xl-1024-v1-0')
        
        # 默认参数
        self.default_width = config.get('default_width', 1024)
        self.default_height = config.get('default_height', 1024)
        self.default_steps = config.get('default_steps', 30)
        self.default_cfg_scale = config.get('default_cfg_scale', 7.0)
        self.default_sampler = config.get('default_sampler', 'K_DPM_2_ANCESTRAL')
        
        # 速率限制
        self.rate_limit_requests = config.get('rate_limit_requests', 150)
        self.rate_limit_window = config.get('rate_limit_window', 60)
        
        # 请求历史
        self._request_history = []
        
        if not self.api_key:
            logger.warning("Stable Diffusion API key not configured")
    
    async def generate(self, request: ImageGenerationRequest) -> ImageOperationResult:
        """生成图片"""
        if not self.api_key:
            return ImageOperationResult(
                success=False,
                message="Stable Diffusion API key not configured",
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
            
            # 调用Stable Diffusion API
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.api_base}/generation/{self.engine_id}/text-to-image",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    json=api_request,
                    timeout=aiohttp.ClientTimeout(total=180)  # 3分钟超时
                ) as response:
                    
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"Stable Diffusion API error {response.status}: {error_text}")
                        return ImageOperationResult(
                            success=False,
                            message=f"Stable Diffusion API error: {response.status}",
                            error_code="api_error"
                        )
                    
                    result_data = await response.json()
            
            # 处理API响应
            return await self._process_api_response(result_data, request)
            
        except asyncio.TimeoutError:
            logger.error("Stable Diffusion API request timeout")
            return ImageOperationResult(
                success=False,
                message="Request timeout",
                error_code="timeout"
            )
        except Exception as e:
            logger.error(f"Stable Diffusion generation failed: {e}")
            return ImageOperationResult(
                success=False,
                message=f"Generation failed: {str(e)}",
                error_code="generation_error"
            )
    
    def _prepare_api_request(self, request: ImageGenerationRequest) -> Dict[str, Any]:
        """准备API请求"""
        # 使用请求中的尺寸
        width, height = request.width, request.height
        
        api_request = {
            "text_prompts": [
                {
                    "text": request.prompt,
                    "weight": 1.0
                }
            ],
            "width": width,
            "height": height,
            "steps": request.steps or self.default_steps,
            "cfg_scale": request.guidance_scale or self.default_cfg_scale,
            "sampler": self.default_sampler,  # 使用默认采样器
            "samples": 1,
            "seed": request.seed if request.seed is not None else 0
        }
        
        # 添加负面提示词
        if request.negative_prompt:
            api_request["text_prompts"].append({
                "text": request.negative_prompt,
                "weight": -1.0
            })
        
        return api_request
    
    async def _process_api_response(self, 
                                  response_data: Dict[str, Any], 
                                  request: ImageGenerationRequest) -> ImageOperationResult:
        """处理API响应"""
        try:
            if 'artifacts' not in response_data or not response_data['artifacts']:
                return ImageOperationResult(
                    success=False,
                    message="No image data in response",
                    error_code="no_data"
                )
            
            artifact = response_data['artifacts'][0]
            
            if artifact.get('finishReason') != 'SUCCESS':
                return ImageOperationResult(
                    success=False,
                    message=f"Generation failed: {artifact.get('finishReason')}",
                    error_code="generation_failed"
                )
            
            # 解码base64图片数据
            image_data = base64.b64decode(artifact['base64'])
            
            # 保存图片
            image_path = await self._save_image(image_data, request)
            
            # 创建图片信息
            image_info = self._create_image_info(
                image_path, len(image_data), request, artifact
            )
            
            return ImageOperationResult(
                success=True,
                message="Image generated successfully",
                image_info=image_info
            )
            
        except Exception as e:
            logger.error(f"Failed to process Stable Diffusion response: {e}")
            return ImageOperationResult(
                success=False,
                message=f"Failed to process response: {str(e)}",
                error_code="response_processing_error"
            )
    
    async def _save_image(self, 
                         image_data: bytes, 
                         request: ImageGenerationRequest) -> Path:
        """保存生成的图片"""
        # 生成文件名
        timestamp = int(time.time())
        filename = f"sd_{timestamp}_{hash(request.prompt) % 10000}.png"
        
        # 创建保存路径
        save_dir = Path("temp/images_cache/ai_generated/stable_diffusion")
        save_dir.mkdir(parents=True, exist_ok=True)
        image_path = save_dir / filename
        
        # 保存图片
        def _save():
            with open(image_path, 'wb') as f:
                f.write(image_data)
        
        await asyncio.get_event_loop().run_in_executor(None, _save)
        
        return image_path
    
    def _create_image_info(self, 
                          image_path: Path, 
                          image_size: int,
                          request: ImageGenerationRequest,
                          artifact: Dict[str, Any]) -> ImageInfo:
        """创建图片信息"""
        # 生成图片ID
        image_id = f"sd_{int(time.time())}_{hash(request.prompt) % 10000}"
        
        # 使用请求中的尺寸
        width, height = request.width, request.height
        
        # 创建元数据
        metadata = ImageMetadata(
            width=width,
            height=height,
            format=ImageFormat.PNG,
            file_size=image_size,
            color_mode="RGB",
            has_transparency=False
        )
        
        # 创建标签
        tags = self._generate_tags_from_prompt(request.prompt)
        
        # 构建描述
        description_parts = [f"Generated by Stable Diffusion with prompt: {request.prompt}"]
        if request.negative_prompt:
            description_parts.append(f"Negative prompt: {request.negative_prompt}")
        if request.seed is not None:
            description_parts.append(f"Seed: {request.seed}")
        
        return ImageInfo(
            image_id=image_id,
            filename=image_path.name,
            title=f"AI Generated: {request.prompt[:50]}...",
            description=" | ".join(description_parts),
            alt_text=request.prompt,
            source_type=ImageSourceType.AI_GENERATED,
            provider=ImageProvider.STABLE_DIFFUSION,
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
        keywords = prompt.lower().replace(',', ' ').split()
        
        # 过滤常见词汇
        stop_words = {
            'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 
            'with', 'by', 'very', 'highly', 'extremely', 'detailed', 'realistic'
        }
        keywords = [word.strip('.,!?;:') for word in keywords if word not in stop_words and len(word) > 2]
        
        # 生成标签
        tags = []
        for i, keyword in enumerate(keywords[:15]):  # 最多15个标签
            confidence = max(0.4, 1.0 - i * 0.05)  # 递减的置信度
            tags.append(ImageTag(
                name=keyword,
                confidence=confidence,
                category="ai_generated"
            ))
        
        return tags
    
    def _extract_keywords_from_prompt(self, prompt: str) -> List[str]:
        """从提示词提取关键词"""
        words = prompt.lower().replace(',', ' ').split()
        stop_words = {
            'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 
            'with', 'by', 'very', 'highly', 'extremely'
        }
        keywords = [word.strip('.,!?;:') for word in words if word not in stop_words and len(word) > 2]
        
        return keywords[:25]  # 最多25个关键词
    
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
            # 检查引擎列表
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.api_base}/engines/list",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    
                    if response.status == 200:
                        return {
                            'status': 'healthy',
                            'message': 'API accessible',
                            'provider': self.provider.value,
                            'engine_id': self.engine_id,
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
                'id': 'stable-diffusion-xl-1024-v1-0',
                'name': 'Stable Diffusion XL 1.0',
                'description': 'High-quality image generation with 1024x1024 resolution',
                'max_resolution': '1024x1024',
                'supported_styles': ['photographic', 'digital-art', 'comic-book', 'fantasy-art', 'line-art', 'analog-film', 'neon-punk', 'isometric', 'low-poly', 'origami', 'modeling-compound', 'cinematic', 'anime', '3d-model', 'pixel-art', 'tile-texture']
            },
            {
                'id': 'stable-diffusion-v1-6',
                'name': 'Stable Diffusion 1.6',
                'description': 'Previous generation model with good quality',
                'max_resolution': '512x512',
                'supported_styles': ['photographic', 'digital-art', 'comic-book', 'fantasy-art']
            }
        ]
