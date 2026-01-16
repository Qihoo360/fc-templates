"""
DEEP Research Service - Advanced research functionality using Tavily API
"""

import asyncio
import json
import logging
import time
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from pathlib import Path

from tavily import TavilyClient
from ..core.config import ai_config
from ..ai import get_ai_provider

logger = logging.getLogger(__name__)

@dataclass
class ResearchStep:
    """Represents a single research step"""
    step_number: int
    query: str
    description: str
    results: List[Dict[str, Any]]
    analysis: str
    completed: bool = False

@dataclass
class ResearchReport:
    """Complete research report"""
    topic: str
    language: str
    steps: List[ResearchStep]
    executive_summary: str
    key_findings: List[str]
    recommendations: List[str]
    sources: List[str]
    created_at: datetime
    total_duration: float

class DEEPResearchService:
    """
    DEEP Research Service implementing comprehensive research methodology:
    D - Define research objectives
    E - Explore multiple perspectives  
    E - Evaluate sources and evidence
    P - Present comprehensive findings
    """
    
    def __init__(self):
        self.tavily_client = None
        self._initialize_tavily_client()

    def _initialize_tavily_client(self):
        """Initialize Tavily client"""
        try:
            current_api_key = ai_config.tavily_api_key
            logger.info(f"Initializing Tavily client with API key: {'***' + current_api_key[-4:] if current_api_key and len(current_api_key) > 4 else 'None'}")

            if current_api_key:
                self.tavily_client = TavilyClient(api_key=current_api_key)
                logger.info("Tavily client initialized successfully")
            else:
                logger.warning("Tavily API key not found in configuration")
                self.tavily_client = None
        except Exception as e:
            logger.error(f"Failed to initialize Tavily client: {e}")
            self.tavily_client = None

    def reload_config(self):
        """Reload configuration and reinitialize Tavily client"""
        logger.info("Reloading research service configuration...")
        # Clear existing client first
        self.tavily_client = None
        # Reinitialize with new config
        self._initialize_tavily_client()
        logger.info(f"Research service reload completed. Available: {self.is_available()}")

    @property
    def ai_provider(self):
        """Dynamically get AI provider to ensure latest config"""
        return get_ai_provider()
    
    async def conduct_deep_research(self, topic: str, language: str = "zh", context: Optional[Dict[str, Any]] = None) -> ResearchReport:
        """
        Conduct comprehensive DEEP research on a given topic

        Args:
            topic: Research topic
            language: Language for research and report (zh/en)
            context: Additional context information (scenario, audience, requirements, etc.)

        Returns:
            Complete research report
        """
        start_time = time.time()
        logger.info(f"Starting DEEP research for topic: {topic}")

        try:
            # Step 1: Define research objectives and generate research plan with context
            research_plan = await self._define_research_objectives(topic, language, context)

            # Step 2: Execute research steps
            research_steps = []
            for i, step_plan in enumerate(research_plan, 1):
                step = await self._execute_research_step(i, step_plan, topic, language)
                research_steps.append(step)

                # Add delay between requests to respect rate limits
                if i < len(research_plan):
                    await asyncio.sleep(1)

            # Step 3: Synthesize findings and generate report
            report = await self._generate_comprehensive_report(
                topic, language, research_steps, time.time() - start_time
            )

            logger.info(f"DEEP research completed in {report.total_duration:.2f} seconds")
            return report

        except Exception as e:
            logger.error(f"DEEP research failed: {e}")
            raise
    
    async def _define_research_objectives(self, topic: str, language: str, context: Optional[Dict[str, Any]] = None) -> List[Dict[str, str]]:
        """Define research objectives and create research plan with context"""

        # Extract context information
        scenario = context.get('scenario', '通用') if context else '通用'
        target_audience = context.get('target_audience', '普通大众') if context else '普通大众'
        requirements = context.get('requirements', '') if context else ''
        ppt_style = context.get('ppt_style', 'general') if context else 'general'
        description = context.get('description', '') if context else ''

        # Build context description
        context_info = f"""
项目背景信息：
- 应用场景：{scenario}
- 目标受众：{target_audience}
- 具体要求：{requirements or '无特殊要求'}
- 演示风格：{ppt_style}
- 补充说明：{description or '无'}
"""

        prompt = f"""
作为专业研究员，请根据以下项目信息制定精准的研究计划：

研究主题：{topic}
语言环境：{language}

{context_info}

请基于上述项目背景，生成5-6个针对性的研究步骤，每个步骤应该：

1. **场景适配**：根据应用场景（{scenario}）调整研究重点和深度
2. **受众导向**：考虑目标受众（{target_audience}）的知识背景和关注点
3. **需求匹配**：紧密结合具体要求，确保研究内容的实用性
4. **专业精准**：使用专业术语和关键词，获取高质量权威信息

请严格按照以下JSON格式返回：

```json
[
    {{
        "query": "具体的搜索查询词",
        "description": "这个步骤的研究目标和预期收获"
    }},
    {{
        "query": "另一个搜索查询词",
        "description": "另一个研究目标"
    }}
]
```

要求：
- 查询词要具体、专业，能获取高质量信息
- 根据应用场景和受众特点调整研究角度和深度
- 覆盖基础概念、现状分析、趋势预测、案例研究、专家观点等维度
- 适合{language}语言环境的搜索习惯
- 确保研究内容与项目需求高度匹配
"""

        try:
            response = await self.ai_provider.text_completion(
                prompt=prompt,
                max_tokens=min(ai_config.max_tokens, 1500),
                temperature=0.3  # Lower temperature for structured planning
            )
            
            # Extract JSON from response
            content = response.content.strip()
            json_start = content.find('[')
            json_end = content.rfind(']') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_str = content[json_start:json_end]
                research_plan = json.loads(json_str)
                
                # Validate plan structure
                if isinstance(research_plan, list) and len(research_plan) > 0:
                    for step in research_plan:
                        if not isinstance(step, dict) or 'query' not in step or 'description' not in step:
                            raise ValueError("Invalid research plan structure")
                    
                    logger.info(f"Generated research plan with {len(research_plan)} steps")
                    return research_plan
            
            raise ValueError("Failed to parse research plan JSON")
            
        except Exception as e:
            logger.error(f"Failed to generate AI research plan: {e}")
            raise Exception(f"Unable to generate research plan for topic '{topic}': {e}")


        else:
            return [
                {"query": f"{topic} definition concepts overview", "description": "Understanding basic concepts and definitions"},
                {"query": f"{topic} current status trends 2024", "description": "Analyzing current status and latest trends"},
                {"query": f"{topic} case studies practical applications", "description": "Collecting real cases and practical applications"},
                {"query": f"{topic} expert opinions research reports", "description": "Gathering expert opinions and authoritative research"},
                {"query": f"{topic} future development predictions", "description": "Exploring future directions and predictions"}
            ]

    async def _execute_research_step(self, step_number: int, step_plan: Dict[str, str],
                                   topic: str, language: str) -> ResearchStep:
        """Execute a single research step"""
        logger.info(f"Executing research step {step_number}: {step_plan['query']}")

        try:
            # Perform Tavily search
            search_results = await self._tavily_search(step_plan['query'], language)

            # Analyze results with AI
            analysis = await self._analyze_search_results(
                step_plan['query'], step_plan['description'], search_results, topic, language
            )

            step = ResearchStep(
                step_number=step_number,
                query=step_plan['query'],
                description=step_plan['description'],
                results=search_results,
                analysis=analysis,
                completed=True
            )

            logger.info(f"Completed research step {step_number}")
            return step

        except Exception as e:
            logger.error(f"Failed to execute research step {step_number}: {e}")
            # Return partial step with error info
            return ResearchStep(
                step_number=step_number,
                query=step_plan['query'],
                description=step_plan['description'],
                results=[],
                analysis=f"研究步骤执行失败: {str(e)}",
                completed=False
            )

    async def _tavily_search(self, query: str, language: str) -> List[Dict[str, Any]]:
        """Perform search using Tavily API"""
        if not self.tavily_client:
            raise ValueError("Tavily client not initialized")

        try:
            # Configure search parameters
            search_params = {
                "query": query,
                "search_depth": ai_config.tavily_search_depth,
                "max_results": ai_config.tavily_max_results,
                "include_answer": True,
                "include_raw_content": False
            }

            # Add domain filters if configured
            if ai_config.tavily_include_domains:
                search_params["include_domains"] = ai_config.tavily_include_domains.split(',')
            if ai_config.tavily_exclude_domains:
                search_params["exclude_domains"] = ai_config.tavily_exclude_domains.split(',')

            # Execute search
            response = self.tavily_client.search(**search_params)

            # Process results
            results = []
            for result in response.get('results', []):
                processed_result = {
                    'title': result.get('title', ''),
                    'url': result.get('url', ''),
                    'content': result.get('content', ''),
                    'score': result.get('score', 0),
                    'published_date': result.get('published_date', '')
                }
                results.append(processed_result)

            logger.info(f"Tavily search returned {len(results)} results for query: {query}")
            return results

        except Exception as e:
            logger.error(f"Tavily search failed for query '{query}': {e}")
            return []

    async def _analyze_search_results(self, query: str, description: str,
                                    results: List[Dict[str, Any]], topic: str, language: str) -> str:
        """Analyze search results using AI"""
        if not results:
            return "未找到相关搜索结果" if language == "zh" else "No relevant search results found"

        # Prepare results summary for AI analysis
        results_summary = ""
        for i, result in enumerate(results[:5], 1):  # Limit to top 5 results
            results_summary += f"\n{i}. 标题: {result['title']}\n"
            results_summary += f"   来源: {result['url']}\n"
            results_summary += f"   内容摘要: {result['content'][:300]}...\n"

        prompt = f"""
作为专业研究分析师，请分析以下搜索结果：

研究主题：{topic}
搜索查询：{query}
研究目标：{description}

搜索结果：{results_summary}

请提供深入的分析，包括：
1. 关键信息提取和总结
2. 信息的可靠性和权威性评估
3. 与研究目标的相关性分析
4. 发现的重要趋势或模式
5. 需要进一步关注的要点

请用{language}语言撰写分析报告，要求客观、专业、有深度。
"""

        try:
            response = await self.ai_provider.text_completion(
                prompt=prompt,
                max_tokens=min(ai_config.max_tokens, 1000),
                temperature=0.4
            )

            return response.content.strip()

        except Exception as e:
            logger.error(f"Failed to analyze search results: {e}")
            return f"分析失败: {str(e)}" if language == "zh" else f"Analysis failed: {str(e)}"

    async def _generate_comprehensive_report(self, topic: str, language: str,
                                           research_steps: List[ResearchStep],
                                           duration: float) -> ResearchReport:
        """Generate comprehensive research report"""
        logger.info("Generating comprehensive research report")

        try:
            # Collect all findings
            all_findings = []
            all_sources = set()

            for step in research_steps:
                if step.completed and step.analysis:
                    all_findings.append(f"**{step.description}**\n{step.analysis}")

                for result in step.results:
                    if result.get('url'):
                        all_sources.add(result['url'])

            # Generate executive summary and recommendations
            summary_analysis = await self._generate_executive_summary(
                topic, language, all_findings
            )

            # Extract key findings and recommendations
            key_findings = await self._extract_key_findings(topic, language, all_findings)
            recommendations = await self._generate_recommendations(topic, language, all_findings)

            report = ResearchReport(
                topic=topic,
                language=language,
                steps=research_steps,
                executive_summary=summary_analysis,
                key_findings=key_findings,
                recommendations=recommendations,
                sources=list(all_sources),
                created_at=datetime.now(),
                total_duration=duration
            )

            logger.info("Research report generated successfully")
            return report

        except Exception as e:
            logger.error(f"Failed to generate research report: {e}")
            raise

    async def _generate_executive_summary(self, topic: str, language: str,
                                        findings: List[str]) -> str:
        """Generate executive summary"""
        findings_text = "\n\n".join(findings)

        prompt = f"""
基于以下研究发现，为主题"{topic}"撰写一份执行摘要：

研究发现：
{findings_text}

请撰写一份简洁而全面的执行摘要，包括：
1. 研究主题的核心要点
2. 主要发现的概述
3. 关键趋势和模式
4. 重要结论

要求：
- 使用{language}语言
- 长度控制在200-300字
- 客观、专业、易懂
- 突出最重要的信息
"""

        try:
            response = await self.ai_provider.text_completion(
                prompt=prompt,
                max_tokens=min(ai_config.max_tokens, 800),
                temperature=0.3
            )
            return response.content.strip()
        except Exception as e:
            logger.error(f"Failed to generate executive summary: {e}")
            return "执行摘要生成失败" if language == "zh" else "Executive summary generation failed"

    async def _extract_key_findings(self, topic: str, language: str,
                                  findings: List[str]) -> List[str]:
        """Extract key findings from research"""
        findings_text = "\n\n".join(findings)

        prompt = f"""
从以下研究发现中提取5-8个最重要的关键发现：

研究主题：{topic}
研究发现：
{findings_text}

请提取最重要的关键发现，每个发现用一句话概括。

要求：
- 使用{language}语言
- 每个发现独立成句
- 突出最有价值的信息
- 避免重复内容

请按以下格式返回：
1. 第一个关键发现
2. 第二个关键发现
3. 第三个关键发现
...
"""

        try:
            response = await self.ai_provider.text_completion(
                prompt=prompt,
                max_tokens=min(ai_config.max_tokens, 600),
                temperature=0.3
            )

            # Parse numbered list
            content = response.content.strip()
            findings_list = []
            for line in content.split('\n'):
                line = line.strip()
                if line and (line[0].isdigit() or line.startswith('-') or line.startswith('•')):
                    # Remove numbering and clean up
                    clean_finding = line.split('.', 1)[-1].strip()
                    if clean_finding:
                        findings_list.append(clean_finding)

            return findings_list[:8]  # Limit to 8 findings

        except Exception as e:
            logger.error(f"Failed to extract key findings: {e}")
            return ["关键发现提取失败"] if language == "zh" else ["Key findings extraction failed"]

    async def _generate_recommendations(self, topic: str, language: str,
                                      findings: List[str]) -> List[str]:
        """Generate actionable recommendations"""
        findings_text = "\n\n".join(findings)

        prompt = f"""
基于以下研究发现，为主题"{topic}"生成3-5个可行的建议或推荐：

研究发现：
{findings_text}

请生成具体、可行的建议，每个建议应该：
1. 基于研究发现
2. 具有可操作性
3. 对相关人员有实际价值

要求：
- 使用{language}语言
- 每个建议独立成句
- 突出实用性和可行性

请按以下格式返回：
1. 第一个建议
2. 第二个建议
3. 第三个建议
...
"""

        try:
            response = await self.ai_provider.text_completion(
                prompt=prompt,
                max_tokens=min(ai_config.max_tokens, 600),
                temperature=0.4
            )

            # Parse numbered list
            content = response.content.strip()
            recommendations_list = []
            for line in content.split('\n'):
                line = line.strip()
                if line and (line[0].isdigit() or line.startswith('-') or line.startswith('•')):
                    # Remove numbering and clean up
                    clean_rec = line.split('.', 1)[-1].strip()
                    if clean_rec:
                        recommendations_list.append(clean_rec)

            return recommendations_list[:5]  # Limit to 5 recommendations

        except Exception as e:
            logger.error(f"Failed to generate recommendations: {e}")
            return ["建议生成失败"] if language == "zh" else ["Recommendations generation failed"]

    def is_available(self) -> bool:
        """Check if research service is available"""
        return self.tavily_client is not None and self.ai_provider is not None

    def get_status(self) -> Dict[str, Any]:
        """Get service status information"""
        return {
            "tavily_available": self.tavily_client is not None,
            "ai_provider_available": self.ai_provider is not None,
            "ai_provider_type": ai_config.default_ai_provider,
            "max_results": ai_config.tavily_max_results,
            "search_depth": ai_config.tavily_search_depth
        }
