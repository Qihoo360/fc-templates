"""
PPT内容到图片生成提示词的适配器
将PPT幻灯片内容转换为适合AI图片生成的提示词
"""

import logging
import re
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass

from ..models import ImageGenerationRequest, ImageProvider

logger = logging.getLogger(__name__)


@dataclass
class PPTSlideContext:
    """PPT幻灯片上下文信息"""
    title: str
    content: str
    scenario: str
    topic: str
    page_number: int
    total_pages: int
    slide_type: str = "content"
    language: str = "zh"


class PPTPromptAdapter:
    """PPT内容到图片生成提示词的适配器"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        
        # 场景到视觉风格的映射
        self.scenario_styles = {
            "general": "professional, clean, modern",
            "business": "corporate, professional, sleek, business meeting",
            "education": "educational, academic, classroom, learning",
            "technology": "futuristic, digital, high-tech, innovation",
            "tourism": "scenic, beautiful, travel, destination",
            "analysis": "data visualization, charts, analytics, research",
            "history": "historical, vintage, cultural, heritage",
            "medical": "medical, healthcare, clinical, scientific",
            "finance": "financial, banking, investment, economic",
            "marketing": "creative, colorful, engaging, promotional"
        }
        
        # 内容类型到视觉元素的映射
        self.content_type_visuals = {
            "title": "title slide, presentation cover, professional header",
            "overview": "overview diagram, roadmap, structure visualization",
            "content": "content slide, information display, bullet points",
            "conclusion": "conclusion slide, summary, final thoughts",
            "data": "data visualization, charts, graphs, statistics",
            "process": "process flow, workflow, step-by-step diagram",
            "comparison": "comparison chart, versus layout, side-by-side",
            "timeline": "timeline, chronological order, historical progression"
        }
        
        # 语言特定的提示词模板
        self.prompt_templates = {
            "zh": {
                "base": "专业的PPT幻灯片背景图片，{style_desc}，{content_desc}，高质量，商务风格",
                "title": "PPT标题页背景，{topic}主题，{style_desc}，专业设计",
                "content": "PPT内容页背景，支持{content_type}展示，{style_desc}，简洁明了",
                "data": "数据可视化背景，适合图表展示，{style_desc}，专业分析风格",
                "conclusion": "PPT结论页背景，总结性设计，{style_desc}，完整收尾"
            },
            "en": {
                "base": "Professional PPT slide background, {style_desc}, {content_desc}, high quality, business style",
                "title": "PPT title slide background, {topic} theme, {style_desc}, professional design",
                "content": "PPT content slide background, supports {content_type} display, {style_desc}, clean and clear",
                "data": "Data visualization background, suitable for charts, {style_desc}, professional analysis style",
                "conclusion": "PPT conclusion slide background, summary design, {style_desc}, complete ending"
            }
        }
    
    async def generate_image_prompt(self, slide_context: PPTSlideContext) -> str:
        """为PPT幻灯片生成图片提示词"""
        try:
            # 分析幻灯片内容
            content_analysis = self._analyze_slide_content(slide_context)
            
            # 获取场景风格描述
            style_desc = self._get_scenario_style(slide_context.scenario)
            
            # 获取内容类型描述
            content_desc = self._get_content_description(slide_context, content_analysis)
            
            # 选择合适的提示词模板
            template_key = self._select_template_key(slide_context, content_analysis)
            template = self.prompt_templates[slide_context.language][template_key]
            
            # 构建提示词
            prompt = template.format(
                style_desc=style_desc,
                content_desc=content_desc,
                topic=slide_context.topic,
                content_type=content_analysis["type"]
            )
            
            # 添加质量和风格修饰符
            prompt = self._enhance_prompt_quality(prompt, slide_context)
            
            # 添加负面提示词建议
            negative_prompt = self._generate_negative_prompt(slide_context)
            
            logger.info(f"Generated image prompt for slide {slide_context.page_number}: {prompt[:100]}...")
            
            return prompt
            
        except Exception as e:
            logger.error(f"Failed to generate image prompt: {e}")
            # 返回基础提示词
            return self._get_fallback_prompt(slide_context)
    
    async def create_generation_request(self, 
                                      slide_context: PPTSlideContext,
                                      provider: ImageProvider = ImageProvider.DALLE,
                                      **kwargs) -> ImageGenerationRequest:
        """创建图片生成请求"""
        # 生成主提示词
        prompt = await self.generate_image_prompt(slide_context)
        
        # 生成负面提示词
        negative_prompt = self._generate_negative_prompt(slide_context)
        
        # 根据幻灯片类型调整参数
        generation_params = self._get_generation_params(slide_context, provider)
        generation_params.update(kwargs)
        
        return ImageGenerationRequest(
            prompt=prompt,
            negative_prompt=negative_prompt,
            provider=provider,
            **generation_params
        )
    
    def _analyze_slide_content(self, slide_context: PPTSlideContext) -> Dict[str, Any]:
        """分析幻灯片内容"""
        content = slide_context.content.lower()
        title = slide_context.title.lower()
        
        analysis = {
            "type": "content",
            "keywords": [],
            "themes": [],
            "visual_elements": [],
            "complexity": "medium"
        }
        
        # 识别内容类型
        if slide_context.page_number == 1:
            analysis["type"] = "title"
        elif slide_context.page_number == slide_context.total_pages:
            analysis["type"] = "conclusion"
        elif any(word in content for word in ["数据", "统计", "图表", "分析", "data", "chart", "graph"]):
            analysis["type"] = "data"
        elif any(word in content for word in ["流程", "步骤", "过程", "process", "workflow", "step"]):
            analysis["type"] = "process"
        elif any(word in content for word in ["对比", "比较", "versus", "comparison", "vs"]):
            analysis["type"] = "comparison"
        elif any(word in content for word in ["时间", "历史", "发展", "timeline", "history", "evolution"]):
            analysis["type"] = "timeline"
        elif any(word in content for word in ["概述", "总览", "overview", "summary", "outline"]):
            analysis["type"] = "overview"
        
        # 提取关键词
        keywords = self._extract_content_keywords(content + " " + title)
        analysis["keywords"] = keywords[:10]  # 最多10个关键词
        
        # 识别主题
        themes = self._identify_content_themes(content + " " + title)
        analysis["themes"] = themes
        
        # 评估复杂度
        if len(content.split()) > 100:
            analysis["complexity"] = "high"
        elif len(content.split()) < 30:
            analysis["complexity"] = "low"
        
        return analysis
    
    def _extract_content_keywords(self, text: str) -> List[str]:
        """从内容中提取关键词"""
        # 移除标点符号和特殊字符
        text = re.sub(r'[^\w\s]', ' ', text)
        words = text.split()
        
        # 停用词列表
        stop_words = {
            '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '上', '也', '很', '到',
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'
        }
        
        # 过滤停用词和短词
        keywords = [word for word in words if word not in stop_words and len(word) > 2]
        
        # 统计词频并返回最常见的词
        from collections import Counter
        word_counts = Counter(keywords)
        
        return [word for word, count in word_counts.most_common(15)]
    
    def _identify_content_themes(self, text: str) -> List[str]:
        """识别内容主题"""
        themes = []
        text_lower = text.lower()
        
        theme_keywords = {
            "success": ["成功", "成就", "胜利", "优秀", "success", "achievement", "victory", "excellent"],
            "innovation": ["创新", "创意", "新颖", "突破", "innovation", "creative", "novel", "breakthrough"],
            "growth": ["增长", "发展", "提升", "进步", "growth", "development", "improvement", "progress"],
            "teamwork": ["团队", "合作", "协作", "配合", "team", "cooperation", "collaboration", "partnership"],
            "technology": ["技术", "科技", "数字", "智能", "technology", "digital", "smart", "tech"],
            "business": ["商业", "业务", "市场", "经济", "business", "market", "economic", "commercial"],
            "education": ["教育", "学习", "培训", "知识", "education", "learning", "training", "knowledge"],
            "future": ["未来", "前景", "展望", "趋势", "future", "prospect", "outlook", "trend"]
        }
        
        for theme, keywords in theme_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                themes.append(theme)
        
        return themes[:3]  # 最多3个主题
    
    def _get_scenario_style(self, scenario: str) -> str:
        """获取场景对应的视觉风格"""
        return self.scenario_styles.get(scenario, self.scenario_styles["general"])
    
    def _get_content_description(self, slide_context: PPTSlideContext, content_analysis: Dict[str, Any]) -> str:
        """获取内容描述"""
        content_type = content_analysis["type"]
        base_desc = self.content_type_visuals.get(content_type, "professional presentation slide")
        
        # 添加关键词增强
        if content_analysis["keywords"]:
            keywords_str = ", ".join(content_analysis["keywords"][:3])
            base_desc += f", related to {keywords_str}"
        
        # 添加主题增强
        if content_analysis["themes"]:
            themes_str = ", ".join(content_analysis["themes"])
            base_desc += f", {themes_str} theme"
        
        return base_desc
    
    def _select_template_key(self, slide_context: PPTSlideContext, content_analysis: Dict[str, Any]) -> str:
        """选择合适的提示词模板"""
        content_type = content_analysis["type"]
        
        if content_type == "title":
            return "title"
        elif content_type == "data":
            return "data"
        elif content_type == "conclusion":
            return "conclusion"
        else:
            return "content"
    
    def _enhance_prompt_quality(self, prompt: str, slide_context: PPTSlideContext) -> str:
        """增强提示词质量"""
        # 添加质量修饰符
        quality_modifiers = [
            "high resolution",
            "professional quality",
            "clean design",
            "modern aesthetic",
            "suitable for presentation"
        ]
        
        # 根据场景添加特定修饰符
        if slide_context.scenario == "business":
            quality_modifiers.extend(["corporate style", "executive presentation"])
        elif slide_context.scenario == "technology":
            quality_modifiers.extend(["futuristic design", "digital aesthetic"])
        elif slide_context.scenario == "education":
            quality_modifiers.extend(["educational design", "academic style"])
        
        enhanced_prompt = prompt + ", " + ", ".join(quality_modifiers[:3])
        
        return enhanced_prompt
    
    def _generate_negative_prompt(self, slide_context: PPTSlideContext) -> str:
        """生成负面提示词"""
        negative_elements = [
            "cluttered",
            "messy",
            "unprofessional",
            "low quality",
            "blurry",
            "distorted",
            "inappropriate",
            "distracting elements",
            "poor composition",
            "amateur design"
        ]
        
        # 根据场景添加特定的负面元素
        if slide_context.scenario == "business":
            negative_elements.extend(["casual", "informal", "playful"])
        elif slide_context.scenario == "education":
            negative_elements.extend(["complex", "overwhelming", "confusing"])
        
        return ", ".join(negative_elements[:8])
    
    def _get_generation_params(self, slide_context: PPTSlideContext, provider: ImageProvider) -> Dict[str, Any]:
        """获取生成参数"""
        params = {
            "width": 1920,  # PPT标准宽度
            "height": 1080,  # PPT标准高度
            "quality": "standard"
        }
        
        # 根据提供者调整参数
        if provider == ImageProvider.DALLE:
            params.update({
                "size": "1792x1024",  # DALL-E 3支持的最接近16:9的尺寸
                "quality": "standard",
                "style": "natural"  # 更适合PPT背景
            })
        elif provider == ImageProvider.STABLE_DIFFUSION:
            params.update({
                "width": 1024,
                "height": 576,  # 16:9比例
                "steps": 30,
                "cfg_scale": 7.0,
                "sampler": "K_DPM_2_ANCESTRAL"
            })
        
        # 根据幻灯片类型调整
        if slide_context.page_number == 1:  # 标题页
            params["quality"] = "hd" if provider == ImageProvider.DALLE else params.get("quality")
        
        return params
    
    def _get_fallback_prompt(self, slide_context: PPTSlideContext) -> str:
        """获取回退提示词"""
        scenario_style = self._get_scenario_style(slide_context.scenario)
        
        if slide_context.language == "zh":
            return f"专业的PPT幻灯片背景，{scenario_style}风格，适合{slide_context.topic}主题，高质量，商务设计"
        else:
            return f"Professional PPT slide background, {scenario_style} style, suitable for {slide_context.topic} theme, high quality, business design"
