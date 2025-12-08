# -*- coding: utf-8 -*-
from sanic_ext import openapi
from typing import Optional, List, Dict, Any

@openapi.component
class AIConfigModel:
    """AI configuration data model"""
    providers: Optional[List[Dict[str, Any]]] = openapi.Array(
        openapi.Object(),
        description="AI provider list"
    )
    selectedProvider: Optional[str] = openapi.String(description="Currently selected provider ID")
    selectedModel: Optional[str] = openapi.String(description="Currently selected model ID")
    streamMode: Optional[bool] = openapi.Boolean(description="Enable streaming mode")
    deletedBuiltinProviders: Optional[List[str]] = openapi.Array(
        openapi.String(),
        description="Deleted builtin provider IDs"
    )
    useSlimRules: Optional[bool] = openapi.Boolean(description="Use slim prompt rules")

@openapi.component
class AIConfigResponse:
    """AI configuration response model"""
    code: int = openapi.Integer(description="Response code")
    data: Optional[Dict[str, Any]] = openapi.Object(description="Configuration data")
    message: Optional[str] = openapi.String(description="Response message")
