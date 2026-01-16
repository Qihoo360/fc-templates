"""
Research Report Generator - Generate and save Markdown research reports
"""

import os
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional
import re

from .deep_research_service import ResearchReport, ResearchStep

logger = logging.getLogger(__name__)

class ResearchReportGenerator:
    """Generate and manage research reports in Markdown format"""
    
    def __init__(self, reports_dir: str = "research_reports"):
        self.reports_dir = Path(reports_dir)
        self.reports_dir.mkdir(exist_ok=True)
        logger.info(f"Research reports directory: {self.reports_dir.absolute()}")
    
    def generate_markdown_report(self, report: ResearchReport) -> str:
        """Generate Markdown formatted research report"""
        
        # Sanitize topic for filename
        safe_topic = self._sanitize_filename(report.topic)
        timestamp = report.created_at.strftime("%Y%m%d_%H%M%S")
        
        # Generate report content
        markdown_content = self._build_markdown_content(report)
        
        return markdown_content
    
    def save_report_to_file(self, report: ResearchReport, custom_filename: Optional[str] = None) -> str:
        """Save research report to local file system"""
        
        try:
            # Generate filename
            if custom_filename:
                filename = custom_filename
                if not filename.endswith('.md'):
                    filename += '.md'
            else:
                safe_topic = self._sanitize_filename(report.topic)
                timestamp = report.created_at.strftime("%Y%m%d_%H%M%S")
                filename = f"research_{safe_topic}_{timestamp}.md"
            
            # Generate full path
            file_path = self.reports_dir / filename
            
            # Generate markdown content
            markdown_content = self._build_markdown_content(report)
            
            # Write to file
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(markdown_content)
            
            logger.info(f"Research report saved to: {file_path.absolute()}")
            return str(file_path.absolute())
            
        except Exception as e:
            logger.error(f"Failed to save research report: {e}")
            raise
    
    def _build_markdown_content(self, report: ResearchReport) -> str:
        """Build complete Markdown content for the report"""
        
        content = []
        
        # Title and metadata
        content.append(f"# {report.topic} - 深度研究报告")
        content.append("")
        content.append("---")
        content.append("")
        content.append("## 📊 报告信息")
        content.append("")
        content.append(f"- **研究主题**: {report.topic}")
        content.append(f"- **报告语言**: {report.language}")
        content.append(f"- **生成时间**: {report.created_at.strftime('%Y年%m月%d日 %H:%M:%S')}")
        content.append(f"- **研究耗时**: {report.total_duration:.2f} 秒")
        content.append(f"- **研究步骤**: {len(report.steps)} 个")
        content.append(f"- **信息来源**: {len(report.sources)} 个")
        content.append("")
        
        # Executive Summary
        content.append("## 📋 摘要")
        content.append("")
        content.append(report.executive_summary)
        content.append("")
        
        # Key Findings
        if report.key_findings:
            content.append("## 🔍 关键发现")
            content.append("")
            for i, finding in enumerate(report.key_findings, 1):
                content.append(f"{i}. {finding}")
            content.append("")
        
        # Recommendations
        if report.recommendations:
            content.append("## 💡 建议与推荐")
            content.append("")
            for i, recommendation in enumerate(report.recommendations, 1):
                content.append(f"{i}. {recommendation}")
            content.append("")
        
        # Detailed Research Steps
        # content.append("## 🔬 详细研究过程")
        # content.append("")
        
        for step in report.steps:
            # content.append(f"### 步骤 {step.step_number}: {step.description}")
            # content.append("")
            # content.append(f"**搜索查询**: `{step.query}`")
            # content.append("")
            
            if step.completed:
                # content.append("**研究状态**: ✅ 已完成")
                # content.append("")
                # content.append("**分析结果**:")
                # content.append("")
                content.append(step.analysis)
                content.append("")
                
                if step.results:
                    content.append("**主要信息来源**:")
                    content.append("")
                    for i, result in enumerate(step.results[:3], 1):  # Show top 3 sources
                        content.append(f"{i}. [{result.get('title', '未知标题')}]({result.get('url', '#')})")
                        if result.get('content'):
                            # Show first 150 characters of content
                            preview = result['content'][:150] + "..." if len(result['content']) > 150 else result['content']
                            content.append(f"   > {preview}")
                    content.append("")
            else:
                content.append("**研究状态**: ❌ 未完成")
                content.append("")
                content.append(f"**错误信息**: {step.analysis}")
                content.append("")
        
        # Sources
        if report.sources:
            content.append("## 📚 参考来源")
            content.append("")
            for i, source in enumerate(report.sources, 1):
                content.append(f"{i}. {source}")
            content.append("")
        
        # Footer
        content.append("---")
        content.append("")
        content.append("*本报告由 LandPPT DEEP Research 系统自动生成*")
        content.append("")
        content.append(f"*生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*")
        
        return "\n".join(content)
    
    def _sanitize_filename(self, filename: str) -> str:
        """Sanitize filename for safe file system usage"""
        # Remove or replace invalid characters
        sanitized = re.sub(r'[<>:"/\\|?*]', '_', filename)
        # Remove extra spaces and limit length
        sanitized = re.sub(r'\s+', '_', sanitized.strip())
        # Limit length to 50 characters
        if len(sanitized) > 50:
            sanitized = sanitized[:50]
        return sanitized
    
    def list_saved_reports(self) -> list:
        """List all saved research reports"""
        try:
            reports = []
            for file_path in self.reports_dir.glob("*.md"):
                stat = file_path.stat()
                reports.append({
                    "filename": file_path.name,
                    "path": str(file_path.absolute()),
                    "size": stat.st_size,
                    "created": datetime.fromtimestamp(stat.st_ctime),
                    "modified": datetime.fromtimestamp(stat.st_mtime)
                })
            
            # Sort by creation time (newest first)
            reports.sort(key=lambda x: x["created"], reverse=True)
            return reports
            
        except Exception as e:
            logger.error(f"Failed to list saved reports: {e}")
            return []
    
    def delete_report(self, filename: str) -> bool:
        """Delete a saved research report"""
        try:
            file_path = self.reports_dir / filename
            if file_path.exists() and file_path.suffix == '.md':
                file_path.unlink()
                logger.info(f"Deleted research report: {filename}")
                return True
            else:
                logger.warning(f"Report file not found: {filename}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to delete report {filename}: {e}")
            return False
    
    def get_reports_directory(self) -> str:
        """Get the absolute path of reports directory"""
        return str(self.reports_dir.absolute())
