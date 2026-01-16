"""
Global Master Template API endpoints
"""

import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import JSONResponse

from .models import (
    GlobalMasterTemplateCreate, GlobalMasterTemplateUpdate, GlobalMasterTemplateResponse,
    GlobalMasterTemplateDetailResponse, GlobalMasterTemplateGenerateRequest,
    TemplateSelectionRequest, TemplateSelectionResponse
)
from ..services.global_master_template_service import GlobalMasterTemplateService

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/global-master-templates", tags=["Global Master Templates"])

# Service instance
template_service = GlobalMasterTemplateService()


@router.post("/", response_model=GlobalMasterTemplateResponse)
async def create_template(template_data: GlobalMasterTemplateCreate):
    """Create a new global master template"""
    try:
        result = await template_service.create_template(template_data.model_dump())
        return GlobalMasterTemplateResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to create template: {e}")
        raise HTTPException(status_code=500, detail="Failed to create template")


@router.get("/", response_model=dict)
async def get_all_templates(
    active_only: bool = Query(True, description="Only return active templates"),
    tags: Optional[str] = Query(None, description="Filter by tags (comma-separated)"),
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    page_size: int = Query(6, ge=1, le=100, description="Number of items per page"),
    search: Optional[str] = Query(None, description="Search in template name and description")
):
    """Get all global master templates with pagination"""
    try:
        if tags:
            tag_list = [tag.strip() for tag in tags.split(",")]
            result = await template_service.get_templates_by_tags_paginated(
                tag_list, active_only, page, page_size, search
            )
        else:
            result = await template_service.get_all_templates_paginated(
                active_only, page, page_size, search
            )

        return {
            "templates": [GlobalMasterTemplateResponse(**template) for template in result["templates"]],
            "pagination": result["pagination"]
        }
    except Exception as e:
        logger.error(f"Failed to get templates: {e}")
        raise HTTPException(status_code=500, detail="Failed to get templates")


@router.put("/{template_id}", response_model=dict)
async def update_template(template_id: int, update_data: GlobalMasterTemplateUpdate):
    """Update a global master template"""
    try:
        # Filter out None values
        update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
        
        if not update_dict:
            raise HTTPException(status_code=400, detail="No update data provided")
        
        success = await template_service.update_template(template_id, update_dict)
        if not success:
            raise HTTPException(status_code=404, detail="Template not found")
        
        return {"success": True, "message": "Template updated successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update template {template_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update template")


@router.delete("/{template_id}", response_model=dict)
async def delete_template(template_id: int):
    """Delete a global master template"""
    try:
        success = await template_service.delete_template(template_id)
        if not success:
            raise HTTPException(status_code=404, detail="Template not found")
        
        return {"success": True, "message": "Template deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete template {template_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete template")


@router.post("/{template_id}/set-default", response_model=dict)
async def set_default_template(template_id: int):
    """Set a template as the default template"""
    try:
        success = await template_service.set_default_template(template_id)
        if not success:
            raise HTTPException(status_code=404, detail="Template not found")
        
        return {"success": True, "message": "Default template set successfully"}
    except Exception as e:
        logger.error(f"Failed to set default template {template_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to set default template")


@router.get("/default/template", response_model=GlobalMasterTemplateDetailResponse)
async def get_default_template():
    """Get the default global master template"""
    try:
        template = await template_service.get_default_template()
        if not template:
            raise HTTPException(status_code=404, detail="No default template found")
        
        return GlobalMasterTemplateDetailResponse(**template)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get default template: {e}")
        raise HTTPException(status_code=500, detail="Failed to get default template")


@router.get("/{template_id}", response_model=GlobalMasterTemplateDetailResponse)
async def get_template_by_id(template_id: int):
    """Get a global master template by ID"""
    try:
        template = await template_service.get_template_by_id(template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        return GlobalMasterTemplateDetailResponse(**template)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get template {template_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get template")


@router.post("/generate")
async def generate_template_with_ai(request: GlobalMasterTemplateGenerateRequest):
    """Generate a new template using AI (does not save to database)"""
    try:
        # 准备参考图片数据
        reference_image_data = None
        if request.reference_image:
            reference_image_data = {
                "filename": request.reference_image.filename,
                "data": request.reference_image.data,
                "size": request.reference_image.size,
                "type": request.reference_image.type
            }

        # 使用AI生成服务（不保存到数据库）
        result = await template_service.generate_template_with_ai(
            prompt=request.prompt,
            template_name=request.template_name,
            description=request.description,
            tags=request.tags,
            generation_mode=request.generation_mode,
            reference_image=reference_image_data
        )

        return {
            "success": True,
            "message": "模板生成完成！",
            "data": result
        }

    except Exception as e:
        logger.error(f"Failed to generate template with AI: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save-generated", response_model=GlobalMasterTemplateResponse)
async def save_generated_template(request: dict):
    """Save a generated template after user confirmation"""
    try:
        # Extract template data from request
        template_data = {
            'template_name': request.get('template_name'),
            'description': request.get('description', ''),
            'html_template': request.get('html_template'),
            'tags': request.get('tags', []),
            'created_by': 'AI'
        }

        # Add timestamp to avoid name conflicts
        import time
        timestamp = int(time.time())
        template_data['template_name'] = f"{template_data['template_name']}_{timestamp}"

        result = await template_service.create_template(template_data)
        return GlobalMasterTemplateResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to save generated template: {e}")
        raise HTTPException(status_code=500, detail="Failed to save template")


@router.post("/adjust-template")
async def adjust_template(request: dict):
    """Adjust a generated template based on user feedback"""
    from fastapi.responses import StreamingResponse
    import json

    async def adjust_stream():
        try:
            # Get the current template and adjustment request
            current_html = request.get('html_template')
            adjustment_request = request.get('adjustment_request')
            template_name = request.get('template_name', '模板')

            # Send initial status
            yield f"data: {json.dumps({'type': 'status', 'message': '正在分析调整需求...'})}\n\n"

            # Use the template service to adjust the template
            async for chunk in template_service.adjust_template_with_ai_stream(
                current_html=current_html,
                adjustment_request=adjustment_request,
                template_name=template_name
            ):
                yield f"data: {json.dumps(chunk)}\n\n"

        except Exception as e:
            logger.error(f"Failed to adjust template: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        adjust_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream"
        }
    )


@router.post("/select", response_model=TemplateSelectionResponse)
async def select_template_for_project(request: TemplateSelectionRequest):
    """Select a template for PPT generation"""
    try:
        if request.selected_template_id:
            # Get the selected template
            template = await template_service.get_template_by_id(request.selected_template_id)
            if not template:
                raise HTTPException(status_code=404, detail="Selected template not found")
            
            # Increment usage count
            await template_service.increment_template_usage(request.selected_template_id)
            
            return TemplateSelectionResponse(
                success=True,
                message="Template selected successfully",
                selected_template=GlobalMasterTemplateResponse(**template)
            )
        else:
            # Use default template
            template = await template_service.get_default_template()
            if not template:
                raise HTTPException(status_code=404, detail="No default template found")
            
            # Increment usage count
            await template_service.increment_template_usage(template['id'])
            
            return TemplateSelectionResponse(
                success=True,
                message="Default template selected",
                selected_template=GlobalMasterTemplateResponse(**template)
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to select template: {e}")
        raise HTTPException(status_code=500, detail="Failed to select template")


@router.post("/{template_id}/duplicate", response_model=GlobalMasterTemplateResponse)
async def duplicate_template(template_id: int, new_name: str = Query(..., description="New template name")):
    """Duplicate an existing template"""
    try:
        # Get the original template
        original = await template_service.get_template_by_id(template_id)
        if not original:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Create duplicate data
        duplicate_data = {
            'template_name': new_name,
            'description': f"复制自: {original['template_name']}",
            'html_template': original['html_template'],
            'tags': original['tags'] + ['复制'],
            'created_by': 'duplicate'
        }
        
        result = await template_service.create_template(duplicate_data)
        return GlobalMasterTemplateResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to duplicate template {template_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to duplicate template")


@router.get("/{template_id}/preview", response_model=dict)
async def get_template_preview(template_id: int):
    """Get template preview data"""
    try:
        template = await template_service.get_template_by_id(template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        return {
            "id": template['id'],
            "template_name": template['template_name'],
            "preview_image": template['preview_image'],
            "html_template": template['html_template']
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get template preview {template_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get template preview")


# Add increment usage endpoint for internal use
@router.post("/{template_id}/increment-usage", response_model=dict)
async def increment_template_usage(template_id: int):
    """Increment template usage count (internal use)"""
    try:
        success = await template_service.increment_template_usage(template_id)
        if not success:
            raise HTTPException(status_code=404, detail="Template not found")
        
        return {"success": True, "message": "Usage count incremented"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to increment usage for template {template_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to increment usage count")
