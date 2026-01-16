"""
Enhanced Report Generator for Comprehensive Research Reports

This module provides flexible, detailed report generation without rigid module divisions,
focusing on comprehensive content analysis and professional presentation.
"""

import logging
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
from .enhanced_research_service import EnhancedResearchReport, EnhancedResearchStep

logger = logging.getLogger(__name__)


class EnhancedReportGenerator:
    """Generate comprehensive, flexible research reports"""
    
    def __init__(self, reports_dir: str = "research_reports"):
        self.reports_dir = Path(reports_dir)
        self.reports_dir.mkdir(exist_ok=True)
        logger.info(f"Enhanced research reports directory: {self.reports_dir.absolute()}")
    
    def generate_markdown_report(self, report: EnhancedResearchReport) -> str:
        """Generate comprehensive Markdown formatted research report"""
        
        # Build comprehensive report content
        markdown_content = self._build_enhanced_markdown_content(report)
        return markdown_content
    
    def save_report_to_file(self, report: EnhancedResearchReport, 
                          custom_filename: Optional[str] = None) -> str:
        """Save enhanced research report to file"""
        
        try:
            # Generate filename
            if custom_filename:
                filename = custom_filename
                if not filename.endswith('.md'):
                    filename += '.md'
            else:
                safe_topic = self._sanitize_filename(report.topic)
                timestamp = report.created_at.strftime("%Y%m%d_%H%M%S")
                filename = f"enhanced_research_{safe_topic}_{timestamp}.md"
            
            # Generate full path
            file_path = self.reports_dir / filename
            
            # Generate markdown content
            markdown_content = self._build_enhanced_markdown_content(report)
            
            # Write to file
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(markdown_content)
            
            logger.info(f"Enhanced research report saved to: {file_path.absolute()}")
            return str(file_path.absolute())
            
        except Exception as e:
            logger.error(f"Failed to save enhanced research report: {e}")
            raise
    
    def _build_enhanced_markdown_content(self, report: EnhancedResearchReport) -> str:
        """Build comprehensive markdown content without rigid divisions"""
        
        content = []
        
        # Header with metadata
        content.append(f"# 深度研究报告：{report.topic}")
        content.append("")
        content.append("---")
        content.append("")
        
        # Report metadata
        content.append("## 📊 报告信息")
        content.append("")
        content.append(f"- **研究主题**: {report.topic}")
        content.append(f"- **报告语言**: {report.language}")
        content.append(f"- **生成时间**: {report.created_at.strftime('%Y年%m月%d日 %H:%M:%S')}")
        content.append(f"- **研究时长**: {report.total_duration:.2f} 秒")
        content.append(f"- **研究步骤**: {len(report.steps)} 个")
        content.append(f"- **信息来源**: {len(report.sources)} 个")
        content.append("")
        
        # Provider statistics
        if report.provider_stats:
            content.append("### 🔍 数据来源统计")
            content.append("")
            for provider, count in report.provider_stats.items():
                if count > 0:
                    provider_name = {
                        'tavily': 'Tavily 搜索',
                        'searxng': 'SearXNG 搜索', 
                        'content_extraction': '深度内容提取'
                    }.get(provider, provider)
                    content.append(f"- **{provider_name}**: {count} 次")
            content.append("")
        
        # Content analysis overview
        if report.content_analysis:
            stats = report.content_analysis.get('content_stats', {})
            if stats:
                content.append("### 📈 内容分析概览")
                content.append("")
                if stats.get('total_words', 0) > 0:
                    content.append(f"- **提取文字总数**: {stats['total_words']:,} 字")
                if stats.get('tavily_results', 0) > 0:
                    content.append(f"- **Tavily 搜索结果**: {stats['tavily_results']} 条")
                if stats.get('searxng_results', 0) > 0:
                    content.append(f"- **SearXNG 搜索结果**: {stats['searxng_results']} 条")
                if stats.get('extracted_pages', 0) > 0:
                    content.append(f"- **深度提取页面**: {stats['extracted_pages']} 个")
                
                quality = report.content_analysis.get('analysis_quality', 'basic')
                quality_text = {'high': '高质量', 'medium': '中等质量', 'basic': '基础质量'}.get(quality, quality)
                content.append(f"- **分析质量**: {quality_text}")
                content.append("")
        
        # Executive Summary
        content.append("## 📋 执行摘要")
        content.append("")
        content.append(report.executive_summary)
        content.append("")
        
        # Comprehensive Analysis (if available)
        if report.content_analysis and report.content_analysis.get('comprehensive_analysis'):
            content.append("## 🔬 综合分析")
            content.append("")
            content.append(report.content_analysis['comprehensive_analysis'])
            content.append("")
        
        # Key Findings
        if report.key_findings:
            content.append("## 🔍 关键发现")
            content.append("")
            for i, finding in enumerate(report.key_findings, 1):
                content.append(f"### {i}. {finding}")
                content.append("")
        
        # Detailed Research Steps
        content.append("## 📚 详细研究过程")
        content.append("")
        
        for step in report.steps:
            content.append(f"### 步骤 {step.step_number}: {step.description}")
            content.append("")
            content.append(f"**搜索查询**: `{step.query}`")
            content.append(f"**执行时间**: {step.duration:.2f} 秒")
            content.append("")
            
            # Data sources for this step
            sources_info = []
            if step.tavily_results:
                sources_info.append(f"Tavily: {len(step.tavily_results)} 条结果")
            if step.searxng_results:
                sources_info.append(f"SearXNG: {len(step.searxng_results.results)} 条结果")
            if step.extracted_content:
                sources_info.append(f"深度提取: {len(step.extracted_content)} 个页面")
            
            if sources_info:
                content.append(f"**数据来源**: {' | '.join(sources_info)}")
                content.append("")
            
            # Step analysis
            if step.analysis:
                content.append("#### 分析结果")
                content.append("")
                content.append(step.analysis)
                content.append("")
            
            # Detailed results (collapsible sections)
            if step.tavily_results or step.searxng_results or step.extracted_content:
                content.append("<details>")
                content.append("<summary>📊 详细搜索结果</summary>")
                content.append("")
                
                # Tavily results
                if step.tavily_results:
                    content.append("**Tavily 搜索结果:**")
                    content.append("")
                    for i, result in enumerate(step.tavily_results[:5], 1):
                        content.append(f"{i}. [{result.get('title', 'No title')}]({result.get('url', '#')})")
                        if result.get('content'):
                            content.append(f"   > {result['content'][:200]}...")
                        content.append("")
                
                # SearXNG results
                if step.searxng_results:
                    content.append("**SearXNG 搜索结果:**")
                    content.append("")
                    for i, result in enumerate(step.searxng_results.results[:5], 1):
                        content.append(f"{i}. [{result.title}]({result.url})")
                        if result.content:
                            content.append(f"   > {result.content[:200]}...")
                        content.append("")
                
                # Extracted content
                if step.extracted_content:
                    content.append("**深度内容提取:**")
                    content.append("")
                    for i, extracted in enumerate(step.extracted_content[:3], 1):
                        content.append(f"{i}. [{extracted.title}]({extracted.url}) ({extracted.word_count} 字)")
                        if extracted.content:
                            content.append(f"   > {extracted.content[:300]}...")
                        content.append("")
                
                content.append("</details>")
                content.append("")
        
        # Recommendations
        if report.recommendations:
            content.append("## 💡 建议与推荐")
            content.append("")
            for i, recommendation in enumerate(report.recommendations, 1):
                content.append(f"### {i}. {recommendation}")
                content.append("")
        
        # Sources
        if report.sources:
            content.append("## 📖 参考来源")
            content.append("")
            for i, source in enumerate(report.sources, 1):
                content.append(f"{i}. {source}")
            content.append("")
        
        # Footer
        content.append("---")
        content.append("")
        content.append("*本报告由 LandPPT 增强研究系统生成*")
        content.append("")
        content.append(f"**生成时间**: {datetime.now().strftime('%Y年%m月%d日 %H:%M:%S')}")
        
        return "\n".join(content)
    
    def _sanitize_filename(self, filename: str) -> str:
        """Sanitize filename for safe file system usage"""
        # Remove or replace invalid characters
        filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
        # Remove extra spaces and limit length
        filename = re.sub(r'\s+', '_', filename.strip())
        return filename[:50] if len(filename) > 50 else filename
    
    def list_reports(self) -> List[Dict[str, Any]]:
        """List all saved research reports"""
        reports = []
        
        try:
            for file_path in self.reports_dir.glob("*.md"):
                if file_path.is_file():
                    stat = file_path.stat()
                    reports.append({
                        'filename': file_path.name,
                        'path': str(file_path.absolute()),
                        'size': stat.st_size,
                        'created': datetime.fromtimestamp(stat.st_ctime),
                        'modified': datetime.fromtimestamp(stat.st_mtime)
                    })
            
            # Sort by modification time (newest first)
            reports.sort(key=lambda x: x['modified'], reverse=True)
            
        except Exception as e:
            logger.error(f"Failed to list reports: {e}")
        
        return reports
