"""
Configuration management API for LandPPT
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
import logging
import os
import sys
import signal
import asyncio

from ..services.config_service import get_config_service, ConfigService
from ..core.config import reload_ai_config
from ..auth.middleware import get_current_admin_user
from ..database.models import User

logger = logging.getLogger(__name__)

router = APIRouter()


# Pydantic models
class ConfigUpdateRequest(BaseModel):
    config: Dict[str, Any]





class DefaultProviderRequest(BaseModel):
    provider: str


@router.get("/api/config/all")
async def get_all_config(
    config_service: ConfigService = Depends(get_config_service),
    user: User = Depends(get_current_admin_user)
):
    """Get all configuration values"""
    try:
        config = config_service.get_all_config()
        return {
            "success": True,
            "config": config
        }
    except Exception as e:
        logger.error(f"Failed to get configuration: {e}")
        raise HTTPException(status_code=500, detail="Failed to get configuration")


@router.get("/api/config/{category}")
async def get_config_by_category(
    category: str,
    config_service: ConfigService = Depends(get_config_service),
    user: User = Depends(get_current_admin_user)
):
    """Get configuration values by category"""
    try:
        config = config_service.get_config_by_category(category)
        return {
            "success": True,
            "config": config,
            "category": category
        }
    except Exception as e:
        logger.error(f"Failed to get configuration for category {category}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get configuration for category {category}")


@router.post("/api/config/all")
async def update_all_config(
    request: ConfigUpdateRequest,
    config_service: ConfigService = Depends(get_config_service),
    user: User = Depends(get_current_admin_user)
):
    """Update all configuration values"""
    try:
        # Validate configuration
        errors = config_service.validate_config(request.config)
        if errors:
            return {
                "success": False,
                "errors": errors
            }
        
        # Update configuration
        success = config_service.update_config(request.config)
        
        if success:
            reload_ai_config()
            return {
                "success": True,
                "message": "Configuration updated successfully"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to update configuration")
            
    except Exception as e:
        logger.error(f"Failed to update configuration: {e}")
        raise HTTPException(status_code=500, detail="Failed to update configuration")


# Specific routes first (before generic {category} route)
@router.post("/api/config/default-provider")
async def set_default_provider(
    request: DefaultProviderRequest,
    config_service: ConfigService = Depends(get_config_service),
    user: User = Depends(get_current_admin_user)
):
    """Set default AI provider"""
    try:
        success = config_service.update_config({
            "default_ai_provider": request.provider
        })

        if success:
            # Verify the configuration was applied
            from ..core.config import ai_config
            current_provider = ai_config.default_ai_provider

            return {
                "success": True,
                "message": f"Default provider set to {request.provider}",
                "current_provider": current_provider,
                "config_applied": current_provider == request.provider
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to set default provider")

    except Exception as e:
        logger.error(f"Failed to set default provider: {e}")
        raise HTTPException(status_code=500, detail="Failed to set default provider")


@router.get("/api/config/current-provider")
async def get_current_provider():
    """Get current default AI provider"""
    try:
        from ..core.config import ai_config
        return {
            "success": True,
            "current_provider": ai_config.default_ai_provider,
            "provider_config": ai_config.get_provider_config()
        }
    except Exception as e:
        logger.error(f"Failed to get current provider: {e}")
        raise HTTPException(status_code=500, detail="Failed to get current provider")


@router.get("/api/config/schema")
async def get_config_schema(
    config_service: ConfigService = Depends(get_config_service),
    user: User = Depends(get_current_admin_user)
):
    """Get configuration schema"""
    try:
        schema = config_service.get_config_schema()
        return {
            "success": True,
            "schema": schema
        }
    except Exception as e:
        logger.error(f"Failed to get configuration schema: {e}")
        raise HTTPException(status_code=500, detail="Failed to get configuration schema")


@router.post("/api/config/validate")
async def validate_config(
    request: ConfigUpdateRequest,
    config_service: ConfigService = Depends(get_config_service),
    user: User = Depends(get_current_admin_user)
):
    """Validate configuration values"""
    try:
        errors = config_service.validate_config(request.config)
        return {
            "success": len(errors) == 0,
            "errors": errors
        }
    except Exception as e:
        logger.error(f"Failed to validate configuration: {e}")
        raise HTTPException(status_code=500, detail="Failed to validate configuration")


@router.post("/api/config/reset/{category}")
async def reset_config_category(
    category: str,
    config_service: ConfigService = Depends(get_config_service),
    user: User = Depends(get_current_admin_user)
):
    """Reset configuration category to defaults"""
    try:
        success = config_service.reset_to_defaults(category)

        if success:
            return {
                "success": True,
                "message": f"Configuration for {category} reset to defaults"
            }
        else:
            raise HTTPException(status_code=500, detail=f"Failed to reset configuration for {category}")

    except Exception as e:
        logger.error(f"Failed to reset configuration for category {category}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to reset configuration for {category}")


@router.post("/api/config/reset")
async def reset_all_config(
    config_service: ConfigService = Depends(get_config_service),
    user: User = Depends(get_current_admin_user)
):
    """Reset all configuration to defaults"""
    try:
        success = config_service.reset_to_defaults()

        if success:
            return {
                "success": True,
                "message": "All configuration reset to defaults"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to reset configuration")

    except Exception as e:
        logger.error(f"Failed to reset configuration: {e}")
        raise HTTPException(status_code=500, detail="Failed to reset configuration")


# Generic category route last
@router.post("/api/config/{category}")
async def update_config_by_category(
    category: str,
    request: ConfigUpdateRequest,
    config_service: ConfigService = Depends(get_config_service),
    user: User = Depends(get_current_admin_user)
):
    """Update configuration values for a specific category"""
    try:
        # Validate configuration
        errors = config_service.validate_config(request.config)
        if errors:
            return {
                "success": False,
                "errors": errors
            }

        # Update configuration
        success = config_service.update_config_by_category(category, request.config)

        if success:
            reload_ai_config()
            return {
                "success": True,
                "message": f"Configuration for {category} updated successfully"
            }
        else:
            raise HTTPException(status_code=500, detail=f"Failed to update configuration for {category}")

    except Exception as e:
        logger.error(f"Failed to update configuration for category {category}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update configuration for {category}")






