"""
生成器模块 - 包含PPT生成器和处理链
"""

from .chains import ChainManager

# Note: PPTOutlineGenerator is not imported here to avoid langgraph dependency issues
# Import it directly when needed: from summeryanyfile.generators.ppt_generator import PPTOutlineGenerator

__all__ = [
    "ChainManager",
]
