"""
图片处理器核心类
"""

import asyncio
import logging
from typing import Optional, Tuple, Dict, Any, List
from pathlib import Path
import hashlib
import time
from PIL import Image, ImageEnhance, ImageFilter, ImageDraw, ImageFont
import io

from ..models import (
    ImageInfo, ImageMetadata, ImageFormat, ImageProcessingOptions,
    ImageOperationResult
)

logger = logging.getLogger(__name__)


class ImageProcessor:
    """图片处理器"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.max_width = config.get('max_image_width', 1920)
        self.max_height = config.get('max_image_height', 1080)
        self.default_quality = config.get('compression_quality', 85)
        self.auto_resize = config.get('auto_resize_enabled', True)
        
        # 支持的格式
        self.supported_formats = {
            ImageFormat.JPEG: 'JPEG',
            ImageFormat.JPG: 'JPEG',
            ImageFormat.PNG: 'PNG',
            ImageFormat.GIF: 'GIF',
            ImageFormat.WEBP: 'WEBP',
            ImageFormat.BMP: 'BMP',
            ImageFormat.TIFF: 'TIFF'
        }
        
        # 重采样方法映射
        self.resample_methods = {
            'lanczos': Image.Resampling.LANCZOS,
            'bicubic': Image.Resampling.BICUBIC,
            'bilinear': Image.Resampling.BILINEAR,
            'nearest': Image.Resampling.NEAREST
        }
    
    async def process_image(self, 
                          input_path: Path, 
                          output_path: Path,
                          options: Optional[ImageProcessingOptions] = None) -> ImageOperationResult:
        """处理图片"""
        start_time = time.time()
        
        try:
            # 使用默认选项如果未提供
            if options is None:
                options = ImageProcessingOptions()
            
            # 在线程池中执行图片处理
            result = await asyncio.get_event_loop().run_in_executor(
                None, self._process_image_sync, input_path, output_path, options
            )
            
            processing_time = time.time() - start_time
            result.processing_time = processing_time
            
            return result
            
        except Exception as e:
            logger.error(f"Image processing failed: {e}")
            return ImageOperationResult(
                success=False,
                message=f"Image processing failed: {str(e)}",
                error_code="processing_error",
                processing_time=time.time() - start_time
            )
    
    def _process_image_sync(self, 
                           input_path: Path, 
                           output_path: Path,
                           options: ImageProcessingOptions) -> ImageOperationResult:
        """同步处理图片"""
        try:
            # 打开图片
            with Image.open(input_path) as img:
                # 转换为RGB模式（如果需要）
                if img.mode in ('RGBA', 'LA', 'P'):
                    if options.output_format in [ImageFormat.JPEG, ImageFormat.JPG]:
                        # JPEG不支持透明度，转换为RGB
                        background = Image.new('RGB', img.size, (255, 255, 255))
                        if img.mode == 'P':
                            img = img.convert('RGBA')
                        background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                        img = background
                    elif img.mode == 'P':
                        img = img.convert('RGBA')
                
                # 尺寸调整
                if options.resize_width or options.resize_height:
                    img = self._resize_image(img, options)
                elif self.auto_resize and (img.width > self.max_width or img.height > self.max_height):
                    # 自动调整尺寸
                    auto_options = ImageProcessingOptions(
                        resize_width=self.max_width,
                        resize_height=self.max_height,
                        maintain_aspect_ratio=True
                    )
                    img = self._resize_image(img, auto_options)
                
                # 图片增强
                if options.auto_enhance or any([
                    options.brightness, options.contrast, 
                    options.saturation, options.sharpness
                ]):
                    img = self._enhance_image(img, options)
                
                # 添加水印
                if options.add_watermark and options.watermark_text:
                    img = self._add_watermark(img, options)
                
                # 保存图片
                save_kwargs = self._get_save_kwargs(options)
                
                # 确保输出目录存在
                output_path.parent.mkdir(parents=True, exist_ok=True)
                
                img.save(output_path, **save_kwargs)
                
                # 获取处理后的图片信息
                processed_info = self._get_image_info(output_path)
                
                return ImageOperationResult(
                    success=True,
                    message="Image processed successfully",
                    image_info=processed_info
                )
                
        except Exception as e:
            raise Exception(f"Synchronous image processing failed: {str(e)}")
    
    def _resize_image(self, img: Image.Image, options: ImageProcessingOptions) -> Image.Image:
        """调整图片尺寸"""
        original_width, original_height = img.size
        target_width = options.resize_width
        target_height = options.resize_height
        
        if options.maintain_aspect_ratio:
            # 保持宽高比
            if target_width and target_height:
                # 计算缩放比例
                width_ratio = target_width / original_width
                height_ratio = target_height / original_height
                ratio = min(width_ratio, height_ratio)
                
                new_width = int(original_width * ratio)
                new_height = int(original_height * ratio)
            elif target_width:
                ratio = target_width / original_width
                new_width = target_width
                new_height = int(original_height * ratio)
            elif target_height:
                ratio = target_height / original_height
                new_width = int(original_width * ratio)
                new_height = target_height
            else:
                return img
        else:
            # 不保持宽高比
            new_width = target_width or original_width
            new_height = target_height or original_height
        
        # 获取重采样方法
        resample = self.resample_methods.get(options.resize_method, Image.Resampling.LANCZOS)
        
        return img.resize((new_width, new_height), resample)
    
    def _enhance_image(self, img: Image.Image, options: ImageProcessingOptions) -> Image.Image:
        """图片增强"""
        enhanced_img = img
        
        # 亮度调整
        if options.brightness is not None:
            enhancer = ImageEnhance.Brightness(enhanced_img)
            enhanced_img = enhancer.enhance(options.brightness)
        
        # 对比度调整
        if options.contrast is not None:
            enhancer = ImageEnhance.Contrast(enhanced_img)
            enhanced_img = enhancer.enhance(options.contrast)
        
        # 饱和度调整
        if options.saturation is not None:
            enhancer = ImageEnhance.Color(enhanced_img)
            enhanced_img = enhancer.enhance(options.saturation)
        
        # 锐度调整
        if options.sharpness is not None:
            enhancer = ImageEnhance.Sharpness(enhanced_img)
            enhanced_img = enhancer.enhance(options.sharpness)
        
        # 自动增强
        if options.auto_enhance:
            # 简单的自动增强：轻微增加对比度和锐度
            contrast_enhancer = ImageEnhance.Contrast(enhanced_img)
            enhanced_img = contrast_enhancer.enhance(1.1)
            
            sharpness_enhancer = ImageEnhance.Sharpness(enhanced_img)
            enhanced_img = sharpness_enhancer.enhance(1.1)
        
        return enhanced_img
    
    def _add_watermark(self, img: Image.Image, options: ImageProcessingOptions) -> Image.Image:
        """添加水印"""
        try:
            # 创建水印图层
            watermark = Image.new('RGBA', img.size, (0, 0, 0, 0))
            draw = ImageDraw.Draw(watermark)
            
            # 尝试加载字体
            try:
                font_size = max(20, min(img.width, img.height) // 40)
                font = ImageFont.truetype("arial.ttf", font_size)
            except:
                font = ImageFont.load_default()
            
            # 获取文本尺寸
            text = options.watermark_text
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            # 计算水印位置
            margin = 20
            positions = {
                'top_left': (margin, margin),
                'top_right': (img.width - text_width - margin, margin),
                'bottom_left': (margin, img.height - text_height - margin),
                'bottom_right': (img.width - text_width - margin, img.height - text_height - margin),
                'center': ((img.width - text_width) // 2, (img.height - text_height) // 2)
            }
            
            position = positions.get(options.watermark_position, positions['bottom_right'])
            
            # 绘制水印
            alpha = int(255 * options.watermark_opacity)
            draw.text(position, text, font=font, fill=(255, 255, 255, alpha))
            
            # 合并水印
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            return Image.alpha_composite(img, watermark)
            
        except Exception as e:
            logger.warning(f"Failed to add watermark: {e}")
            return img
    
    def _get_save_kwargs(self, options: ImageProcessingOptions) -> Dict[str, Any]:
        """获取保存参数"""
        kwargs = {}
        
        # 质量设置
        quality = options.quality or self.default_quality
        if options.output_format in [ImageFormat.JPEG, ImageFormat.JPG, ImageFormat.WEBP]:
            kwargs['quality'] = quality
            kwargs['optimize'] = options.optimize
            
            if options.output_format in [ImageFormat.JPEG, ImageFormat.JPG]:
                kwargs['progressive'] = options.progressive
        
        # PNG优化
        elif options.output_format == ImageFormat.PNG:
            kwargs['optimize'] = options.optimize
        
        return kwargs
    
    def _get_image_info(self, image_path: Path) -> ImageInfo:
        """获取图片信息"""
        with Image.open(image_path) as img:
            # 基本信息
            width, height = img.size
            format_name = img.format.lower() if img.format else 'unknown'
            file_size = image_path.stat().st_size
            
            # 创建元数据
            metadata = ImageMetadata(
                width=width,
                height=height,
                format=ImageFormat(format_name) if format_name in [f.value for f in ImageFormat] else ImageFormat.JPEG,
                file_size=file_size,
                color_mode=img.mode,
                has_transparency=img.mode in ('RGBA', 'LA', 'P')
            )
            
            # 生成图片ID
            image_id = self._generate_image_id(image_path)
            
            return ImageInfo(
                image_id=image_id,
                source_type="processed",
                provider="image_processor",
                local_path=str(image_path),
                filename=image_path.name,
                metadata=metadata
            )
    
    def _generate_image_id(self, image_path: Path) -> str:
        """生成图片ID"""
        # 使用文件路径和修改时间生成唯一ID
        stat = image_path.stat()
        content = f"{image_path}_{stat.st_mtime}_{stat.st_size}"
        return hashlib.md5(content.encode()).hexdigest()
    
    async def get_image_metadata(self, image_path: Path) -> ImageMetadata:
        """获取图片元数据"""
        def _get_metadata():
            with Image.open(image_path) as img:
                return ImageMetadata(
                    width=img.width,
                    height=img.height,
                    format=ImageFormat(img.format.lower()) if img.format else ImageFormat.JPEG,
                    file_size=image_path.stat().st_size,
                    color_mode=img.mode,
                    has_transparency=img.mode in ('RGBA', 'LA', 'P')
                )
        
        return await asyncio.get_event_loop().run_in_executor(None, _get_metadata)
    
    async def create_thumbnail(self, 
                             input_path: Path, 
                             output_path: Path,
                             size: Tuple[int, int] = (200, 200)) -> ImageOperationResult:
        """创建缩略图"""
        options = ImageProcessingOptions(
            resize_width=size[0],
            resize_height=size[1],
            maintain_aspect_ratio=True,
            quality=80,
            optimize=True
        )
        
        return await self.process_image(input_path, output_path, options)
