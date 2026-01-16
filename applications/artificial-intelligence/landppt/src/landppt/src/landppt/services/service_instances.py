"""
Shared service instances to ensure data consistency across modules
"""

from .enhanced_ppt_service import EnhancedPPTService
from .db_project_manager import DatabaseProjectManager

# Global service instances (lazy initialization)
_ppt_service = None
_project_manager = None

def get_ppt_service() -> EnhancedPPTService:
    """Get PPT service instance (lazy initialization)"""
    global _ppt_service
    if _ppt_service is None:
        _ppt_service = EnhancedPPTService()
    return _ppt_service

def get_project_manager() -> DatabaseProjectManager:
    """Get project manager instance (lazy initialization)"""
    global _project_manager
    if _project_manager is None:
        _project_manager = DatabaseProjectManager()
    return _project_manager

def reload_services():
    """Reload all service instances to pick up new configuration"""
    global _ppt_service, _project_manager

    # First, reload research configuration in existing PPT service instances before clearing them
    try:
        if _ppt_service is not None:
            _ppt_service.reload_research_config()
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to reload research config in PPT service: {e}")

    # Also reload research service if it exists
    try:
        from ..api.landppt_api import reload_research_service
        reload_research_service()
    except ImportError:
        pass  # Research service may not be available

    # Clear service instances to force recreation with new config
    _ppt_service = None
    _project_manager = None

    # Also reload PDF to PPTX converter configuration
    try:
        from .pdf_to_pptx_converter import reload_pdf_to_pptx_converter
        reload_pdf_to_pptx_converter()
    except ImportError:
        pass  # PDF converter may not be available

# Backward compatibility - create module-level variables that get updated
def _update_module_vars():
    """Update module-level variables for backward compatibility"""
    import sys
    current_module = sys.modules[__name__]
    current_module.ppt_service = get_ppt_service()
    current_module.project_manager = get_project_manager()

# Initialize module variables
_update_module_vars()

# Override reload_services to also update module variables
_original_reload_services = reload_services

def reload_services():
    """Reload all service instances and update module variables"""
    import logging
    logger = logging.getLogger(__name__)
    logger.info("Starting service reload process...")

    _original_reload_services()
    logger.info("Original service reload completed")

    # Refresh existing PPT service instance so existing imports pick up new config
    global _ppt_service
    if _ppt_service is not None:
        try:
            _ppt_service.update_ai_config()
            logger.info("Existing PPT service configuration refreshed")
        except Exception as refresh_error:  # noqa: BLE001
            logger.warning("Failed to refresh PPT service configuration: %s", refresh_error, exc_info=True)
    else:
        logger.info("No existing PPT service instance, will initialize on next access")

    # Update module variables after services are reloaded
    _update_module_vars()
    logger.info("Module variables updated with new service instances")

# Export for easy import
__all__ = ['get_ppt_service', 'get_project_manager', 'reload_services', 'ppt_service', 'project_manager']
