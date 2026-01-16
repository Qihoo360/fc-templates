"""
Research module for LandPPT

This module provides comprehensive research functionality including:
- SearXNG content search provider
- Web content extraction pipeline
- Enhanced research service with multiple providers
"""

from .searxng_provider import SearXNGContentProvider, SearXNGSearchResult, SearXNGSearchResponse
from .content_extractor import WebContentExtractor, ExtractedContent
from .enhanced_research_service import (
    EnhancedResearchService, 
    EnhancedResearchStep, 
    EnhancedResearchReport
)

__all__ = [
    'SearXNGContentProvider',
    'SearXNGSearchResult', 
    'SearXNGSearchResponse',
    'WebContentExtractor',
    'ExtractedContent',
    'EnhancedResearchService',
    'EnhancedResearchStep',
    'EnhancedResearchReport'
]
