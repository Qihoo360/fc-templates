"""
智能图片匹配算法
"""

import asyncio
import logging
import re
from typing import List, Dict, Any, Optional, Tuple
import math
from collections import Counter

from ..models import ImageInfo, ImageTag

logger = logging.getLogger(__name__)


class ImageMatcher:
    """智能图片匹配器"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config

        # 匹配权重配置
        self.weights = {
            'keyword_match': config.get('keyword_weight', 0.4),
            'tag_match': config.get('tag_weight', 0.3),
            'description_match': config.get('description_weight', 0.2),
            'usage_popularity': config.get('usage_weight', 0.1)
        }

        # 停用词列表
        self.stop_words = set([
            '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
            '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
            'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have',
            'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
        ])

    async def rank_images(self, query: str, images: List[ImageInfo]) -> List[ImageInfo]:
        """对图片进行智能排序"""
        if not images:
            return images

        try:
            # 提取查询关键词
            query_keywords = self._extract_keywords(query)

            # 计算每个图片的匹配分数
            scored_images = []
            for image in images:
                score = await self._calculate_match_score(query_keywords, image)
                scored_images.append((score, image))

            # 按分数排序
            scored_images.sort(key=lambda x: x[0], reverse=True)

            # 返回排序后的图片列表
            return [image for _, image in scored_images]

        except Exception as e:
            logger.error(f"Failed to rank images: {e}")
            return images

    async def _calculate_match_score(self, query_keywords: List[str], image: ImageInfo) -> float:
        """计算图片匹配分数"""
        total_score = 0.0

        try:
            # 1. 关键词匹配分数
            keyword_score = self._calculate_keyword_score(query_keywords, image)
            total_score += keyword_score * self.weights['keyword_match']

            # 2. 标签匹配分数
            tag_score = self._calculate_tag_score(query_keywords, image)
            total_score += tag_score * self.weights['tag_match']

            # 3. 描述匹配分数
            description_score = self._calculate_description_score(query_keywords, image)
            total_score += description_score * self.weights['description_match']

            # 4. 使用热度分数
            popularity_score = self._calculate_popularity_score(image)
            total_score += popularity_score * self.weights['usage_popularity']

            return total_score

        except Exception as e:
            logger.error(f"Failed to calculate match score for image {image.image_id}: {e}")
            return 0.0

    def _extract_keywords(self, text: str) -> List[str]:
        """提取关键词"""
        if not text:
            return []

        # 转换为小写
        text = text.lower()

        # 使用正则表达式提取单词
        words = re.findall(r'\b\w+\b', text)

        # 过滤停用词和短词
        keywords = [
            word for word in words
            if word not in self.stop_words and len(word) > 1
        ]

        return keywords

    def _calculate_keyword_score(self, query_keywords: List[str], image: ImageInfo) -> float:
        """计算关键词匹配分数"""
        if not query_keywords:
            return 0.0

        # 获取图片的所有关键词
        image_keywords = [kw.lower() for kw in image.keywords]

        # 计算匹配的关键词数量
        matches = 0
        for query_kw in query_keywords:
            for image_kw in image_keywords:
                if query_kw in image_kw or image_kw in query_kw:
                    matches += 1
                    break

        # 计算匹配率
        match_ratio = matches / len(query_keywords)

        return match_ratio

    def _calculate_tag_score(self, query_keywords: List[str], image: ImageInfo) -> float:
        """计算标签匹配分数"""
        if not query_keywords or not image.tags:
            return 0.0

        # 计算匹配分数，考虑标签置信度
        total_score = 0.0
        total_weight = 0.0

        for tag in image.tags:
            tag_name = tag.name.lower()
            tag_confidence = tag.confidence

            # 检查标签是否与查询关键词匹配
            match_score = 0.0
            for query_kw in query_keywords:
                if query_kw in tag_name or tag_name in query_kw:
                    match_score = 1.0
                    break
                elif self._calculate_similarity(query_kw, tag_name) > 0.7:
                    match_score = 0.8

            total_score += match_score * tag_confidence
            total_weight += tag_confidence

        return total_score / total_weight if total_weight > 0 else 0.0

    def _calculate_description_score(self, query_keywords: List[str], image: ImageInfo) -> float:
        """计算描述匹配分数"""
        if not query_keywords:
            return 0.0

        # 合并标题、描述和alt文本
        text_content = []
        if image.title:
            text_content.append(image.title)
        if image.description:
            text_content.append(image.description)
        if image.alt_text:
            text_content.append(image.alt_text)

        if not text_content:
            return 0.0

        # 提取描述中的关键词
        description_text = ' '.join(text_content).lower()
        description_keywords = self._extract_keywords(description_text)

        # 计算TF-IDF相似度
        return self._calculate_tfidf_similarity(query_keywords, description_keywords)

    def _calculate_popularity_score(self, image: ImageInfo) -> float:
        """计算使用热度分数"""
        # 基于使用次数和最近使用时间计算热度
        usage_count = image.usage_count

        # 使用对数缩放避免热门图片过度占优
        usage_score = math.log(usage_count + 1) / math.log(100)  # 归一化到0-1

        return min(usage_score, 1.0)

    def _calculate_similarity(self, word1: str, word2: str) -> float:
        """计算两个词的相似度（简单的编辑距离）"""
        if not word1 or not word2:
            return 0.0

        # 计算编辑距离
        m, n = len(word1), len(word2)
        dp = [[0] * (n + 1) for _ in range(m + 1)]

        for i in range(m + 1):
            dp[i][0] = i
        for j in range(n + 1):
            dp[0][j] = j

        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if word1[i-1] == word2[j-1]:
                    dp[i][j] = dp[i-1][j-1]
                else:
                    dp[i][j] = min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) + 1

        # 转换为相似度
        max_len = max(m, n)
        similarity = 1.0 - (dp[m][n] / max_len) if max_len > 0 else 0.0

        return similarity

    def _calculate_tfidf_similarity(self, query_keywords: List[str], doc_keywords: List[str]) -> float:
        """计算TF-IDF相似度"""
        if not query_keywords or not doc_keywords:
            return 0.0

        # 简化的TF-IDF计算
        query_counter = Counter(query_keywords)
        doc_counter = Counter(doc_keywords)

        # 计算交集
        common_keywords = set(query_keywords) & set(doc_keywords)

        if not common_keywords:
            return 0.0

        # 计算相似度
        similarity = 0.0
        for keyword in common_keywords:
            query_tf = query_counter[keyword] / len(query_keywords)
            doc_tf = doc_counter[keyword] / len(doc_keywords)
            similarity += query_tf * doc_tf

        return similarity

    async def suggest_images_for_content(self,
                                       content: str,
                                       available_images: List[ImageInfo],
                                       max_suggestions: int = 5) -> List[ImageInfo]:
        """为内容推荐图片"""
        try:
            # 分析内容，提取关键信息
            content_keywords = self._extract_keywords(content)

            # 识别内容类型和主题
            content_type = self._identify_content_type(content)
            content_theme = self._identify_content_theme(content)

            # 过滤相关图片
            relevant_images = []
            for image in available_images:
                relevance_score = await self._calculate_content_relevance(
                    content_keywords, content_type, content_theme, image
                )
                if relevance_score > 0.1:  # 设置最低相关度阈值
                    relevant_images.append((relevance_score, image))

            # 排序并返回前N个
            relevant_images.sort(key=lambda x: x[0], reverse=True)

            return [image for _, image in relevant_images[:max_suggestions]]

        except Exception as e:
            logger.error(f"Failed to suggest images for content: {e}")
            return []

    def _identify_content_type(self, content: str) -> str:
        """识别内容类型"""
        content_lower = content.lower()

        # 简单的关键词匹配
        if any(word in content_lower for word in ['数据', '统计', '图表', '分析', 'data', 'chart', 'graph']):
            return 'data'
        elif any(word in content_lower for word in ['技术', '科技', '创新', 'technology', 'innovation']):
            return 'technology'
        elif any(word in content_lower for word in ['商业', '业务', '市场', 'business', 'market']):
            return 'business'
        elif any(word in content_lower for word in ['教育', '学习', '培训', 'education', 'learning']):
            return 'education'
        else:
            return 'general'

    def _identify_content_theme(self, content: str) -> str:
        """识别内容主题"""
        content_lower = content.lower()

        # 主题关键词映射
        themes = {
            'success': ['成功', '成就', '胜利', 'success', 'achievement', 'victory'],
            'growth': ['增长', '发展', '提升', 'growth', 'development', 'improvement'],
            'teamwork': ['团队', '合作', '协作', 'team', 'cooperation', 'collaboration'],
            'innovation': ['创新', '创意', '新颖', 'innovation', 'creative', 'novel'],
            'challenge': ['挑战', '困难', '问题', 'challenge', 'difficulty', 'problem'],
            'future': ['未来', '前景', '展望', 'future', 'prospect', 'outlook']
        }

        for theme, keywords in themes.items():
            if any(keyword in content_lower for keyword in keywords):
                return theme

        return 'neutral'

    async def _calculate_content_relevance(self,
                                         content_keywords: List[str],
                                         content_type: str,
                                         content_theme: str,
                                         image: ImageInfo) -> float:
        """计算图片与内容的相关度"""
        relevance_score = 0.0

        # 基础关键词匹配
        keyword_score = self._calculate_keyword_score(content_keywords, image)
        relevance_score += keyword_score * 0.4

        # 标签匹配
        tag_score = self._calculate_tag_score(content_keywords, image)
        relevance_score += tag_score * 0.3

        # 内容类型匹配
        type_score = self._calculate_type_match(content_type, image)
        relevance_score += type_score * 0.2

        # 主题匹配
        theme_score = self._calculate_theme_match(content_theme, image)
        relevance_score += theme_score * 0.1

        return relevance_score

    def _calculate_type_match(self, content_type: str, image: ImageInfo) -> float:
        """计算内容类型匹配度"""
        # 根据图片标签判断类型匹配
        type_keywords = {
            'data': ['chart', 'graph', 'data', 'statistics', '图表', '数据'],
            'technology': ['tech', 'computer', 'digital', '科技', '技术'],
            'business': ['business', 'office', 'meeting', '商业', '办公'],
            'education': ['education', 'learning', 'book', '教育', '学习']
        }

        if content_type not in type_keywords:
            return 0.5  # 中性分数

        type_words = type_keywords[content_type]
        image_tags = [tag.name.lower() for tag in image.tags]
        image_keywords = [kw.lower() for kw in image.keywords]

        matches = 0
        total_checks = len(type_words)

        for word in type_words:
            if any(word in tag for tag in image_tags) or any(word in kw for kw in image_keywords):
                matches += 1

        return matches / total_checks if total_checks > 0 else 0.0

    def _calculate_theme_match(self, content_theme: str, image: ImageInfo) -> float:
        """计算主题匹配度"""
        # 根据图片的情感色彩和主题标签判断
        theme_keywords = {
            'success': ['success', 'winner', 'achievement', '成功', '胜利'],
            'growth': ['growth', 'arrow', 'up', '增长', '上升'],
            'teamwork': ['team', 'group', 'together', '团队', '合作'],
            'innovation': ['innovation', 'creative', 'new', '创新', '创意'],
            'challenge': ['challenge', 'difficult', 'problem', '挑战', '困难'],
            'future': ['future', 'tomorrow', 'next', '未来', '明天']
        }

        if content_theme not in theme_keywords:
            return 0.5  # 中性分数

        theme_words = theme_keywords[content_theme]
        image_tags = [tag.name.lower() for tag in image.tags]
        image_description = (image.description or '').lower()

        matches = 0
        for word in theme_words:
            if any(word in tag for tag in image_tags) or word in image_description:
                matches += 1

        return min(matches / len(theme_words), 1.0) if theme_words else 0.0
    
    def _calculate_description_score(self, query_keywords: List[str], image: ImageInfo) -> float:
        """计算描述匹配分数"""
        if not query_keywords:
            return 0.0
        
        # 合并标题、描述和alt文本
        text_content = []
        if image.title:
            text_content.append(image.title)
        if image.description:
            text_content.append(image.description)
        if image.alt_text:
            text_content.append(image.alt_text)
        
        if not text_content:
            return 0.0
        
        # 提取描述中的关键词
        description_text = ' '.join(text_content).lower()
        description_keywords = self._extract_keywords(description_text)
        
        # 计算TF-IDF相似度
        return self._calculate_tfidf_similarity(query_keywords, description_keywords)
    
    def _calculate_popularity_score(self, image: ImageInfo) -> float:
        """计算使用热度分数"""
        # 基于使用次数和最近使用时间计算热度
        usage_count = image.usage_count
        
        # 使用对数缩放避免热门图片过度占优
        usage_score = math.log(usage_count + 1) / math.log(100)  # 归一化到0-1
        
        # 考虑最近使用时间（可选）
        # 这里简化处理，只考虑使用次数
        
        return min(usage_score, 1.0)
    
    def _calculate_similarity(self, word1: str, word2: str) -> float:
        """计算两个词的相似度（简单的编辑距离）"""
        if not word1 or not word2:
            return 0.0
        
        # 计算编辑距离
        m, n = len(word1), len(word2)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        
        for i in range(m + 1):
            dp[i][0] = i
        for j in range(n + 1):
            dp[0][j] = j
        
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if word1[i-1] == word2[j-1]:
                    dp[i][j] = dp[i-1][j-1]
                else:
                    dp[i][j] = min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) + 1
        
        # 转换为相似度
        max_len = max(m, n)
        similarity = 1.0 - (dp[m][n] / max_len) if max_len > 0 else 0.0
        
        return similarity
    
    def _calculate_tfidf_similarity(self, query_keywords: List[str], doc_keywords: List[str]) -> float:
        """计算TF-IDF相似度"""
        if not query_keywords or not doc_keywords:
            return 0.0
        
        # 简化的TF-IDF计算
        query_counter = Counter(query_keywords)
        doc_counter = Counter(doc_keywords)
        
        # 计算交集
        common_keywords = set(query_keywords) & set(doc_keywords)
        
        if not common_keywords:
            return 0.0
        
        # 计算相似度
        similarity = 0.0
        for keyword in common_keywords:
            query_tf = query_counter[keyword] / len(query_keywords)
            doc_tf = doc_counter[keyword] / len(doc_keywords)
            similarity += query_tf * doc_tf
        
        return similarity
    
    async def suggest_images_for_content(self, 
                                       content: str, 
                                       available_images: List[ImageInfo],
                                       max_suggestions: int = 5) -> List[ImageInfo]:
        """为内容推荐图片"""
        try:
            # 分析内容，提取关键信息
            content_keywords = self._extract_keywords(content)
            
            # 识别内容类型和主题
            content_type = self._identify_content_type(content)
            content_theme = self._identify_content_theme(content)
            
            # 过滤相关图片
            relevant_images = []
            for image in available_images:
                relevance_score = await self._calculate_content_relevance(
                    content_keywords, content_type, content_theme, image
                )
                if relevance_score > 0.1:  # 设置最低相关度阈值
                    relevant_images.append((relevance_score, image))
            
            # 排序并返回前N个
            relevant_images.sort(key=lambda x: x[0], reverse=True)
            
            return [image for _, image in relevant_images[:max_suggestions]]
            
        except Exception as e:
            logger.error(f"Failed to suggest images for content: {e}")
            return []
    
    def _identify_content_type(self, content: str) -> str:
        """识别内容类型"""
        content_lower = content.lower()
        
        # 简单的关键词匹配
        if any(word in content_lower for word in ['数据', '统计', '图表', '分析', 'data', 'chart', 'graph']):
            return 'data'
        elif any(word in content_lower for word in ['技术', '科技', '创新', 'technology', 'innovation']):
            return 'technology'
        elif any(word in content_lower for word in ['商业', '业务', '市场', 'business', 'market']):
            return 'business'
        elif any(word in content_lower for word in ['教育', '学习', '培训', 'education', 'learning']):
            return 'education'
        else:
            return 'general'
    
    def _identify_content_theme(self, content: str) -> str:
        """识别内容主题"""
        content_lower = content.lower()
        
        # 主题关键词映射
        themes = {
            'success': ['成功', '成就', '胜利', 'success', 'achievement', 'victory'],
            'growth': ['增长', '发展', '提升', 'growth', 'development', 'improvement'],
            'teamwork': ['团队', '合作', '协作', 'team', 'cooperation', 'collaboration'],
            'innovation': ['创新', '创意', '新颖', 'innovation', 'creative', 'novel'],
            'challenge': ['挑战', '困难', '问题', 'challenge', 'difficulty', 'problem'],
            'future': ['未来', '前景', '展望', 'future', 'prospect', 'outlook']
        }
        
        for theme, keywords in themes.items():
            if any(keyword in content_lower for keyword in keywords):
                return theme
        
        return 'neutral'
    
    async def _calculate_content_relevance(self, 
                                         content_keywords: List[str],
                                         content_type: str,
                                         content_theme: str,
                                         image: ImageInfo) -> float:
        """计算图片与内容的相关度"""
        relevance_score = 0.0
        
        # 基础关键词匹配
        keyword_score = self._calculate_keyword_score(content_keywords, image)
        relevance_score += keyword_score * 0.4
        
        # 标签匹配
        tag_score = self._calculate_tag_score(content_keywords, image)
        relevance_score += tag_score * 0.3
        
        # 内容类型匹配
        type_score = self._calculate_type_match(content_type, image)
        relevance_score += type_score * 0.2
        
        # 主题匹配
        theme_score = self._calculate_theme_match(content_theme, image)
        relevance_score += theme_score * 0.1
        
        return relevance_score
    
    def _calculate_type_match(self, content_type: str, image: ImageInfo) -> float:
        """计算内容类型匹配度"""
        # 根据图片标签判断类型匹配
        type_keywords = {
            'data': ['chart', 'graph', 'data', 'statistics', '图表', '数据'],
            'technology': ['tech', 'computer', 'digital', '科技', '技术'],
            'business': ['business', 'office', 'meeting', '商业', '办公'],
            'education': ['education', 'learning', 'book', '教育', '学习']
        }
        
        if content_type not in type_keywords:
            return 0.5  # 中性分数
        
        type_words = type_keywords[content_type]
        image_tags = [tag.name.lower() for tag in image.tags]
        image_keywords = [kw.lower() for kw in image.keywords]
        
        matches = 0
        total_checks = len(type_words)
        
        for word in type_words:
            if any(word in tag for tag in image_tags) or any(word in kw for kw in image_keywords):
                matches += 1
        
        return matches / total_checks if total_checks > 0 else 0.0
    
    def _calculate_theme_match(self, content_theme: str, image: ImageInfo) -> float:
        """计算主题匹配度"""
        # 根据图片的情感色彩和主题标签判断
        theme_keywords = {
            'success': ['success', 'winner', 'achievement', '成功', '胜利'],
            'growth': ['growth', 'arrow', 'up', '增长', '上升'],
            'teamwork': ['team', 'group', 'together', '团队', '合作'],
            'innovation': ['innovation', 'creative', 'new', '创新', '创意'],
            'challenge': ['challenge', 'difficult', 'problem', '挑战', '困难'],
            'future': ['future', 'tomorrow', 'next', '未来', '明天']
        }
        
        if content_theme not in theme_keywords:
            return 0.5  # 中性分数
        
        theme_words = theme_keywords[content_theme]
        image_tags = [tag.name.lower() for tag in image.tags]
        image_description = (image.description or '').lower()
        
        matches = 0
        for word in theme_words:
            if any(word in tag for tag in image_tags) or word in image_description:
                matches += 1
        
        return min(matches / len(theme_words), 1.0) if theme_words else 0.0
