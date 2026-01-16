"""
Repository classes for database operations
"""

import time
import logging
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_
from sqlalchemy.orm import selectinload

from .models import Project, TodoBoard, TodoStage, ProjectVersion, SlideData, PPTTemplate, GlobalMasterTemplate
from ..api.models import PPTProject, TodoBoard as TodoBoardModel, TodoStage as TodoStageModel

logger = logging.getLogger(__name__)


class ProjectRepository:
    """Repository for Project operations"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(self, project_data: Dict[str, Any]) -> Project:
        """Create a new project"""
        project = Project(**project_data)
        self.session.add(project)
        await self.session.commit()
        await self.session.refresh(project)
        return project
    
    async def get_by_id(self, project_id: str) -> Optional[Project]:
        """Get project by ID with all relationships"""
        stmt = select(Project).where(Project.project_id == project_id).options(
            selectinload(Project.todo_board).selectinload(TodoBoard.stages),
            selectinload(Project.versions),
            selectinload(Project.slides)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def list_projects(self, page: int = 1, page_size: int = 10, status: Optional[str] = None) -> List[Project]:
        """List projects with pagination"""
        stmt = select(Project).options(
            selectinload(Project.todo_board).selectinload(TodoBoard.stages),
            selectinload(Project.versions),
            selectinload(Project.slides)
        )
        
        if status:
            stmt = stmt.where(Project.status == status)
        
        stmt = stmt.order_by(Project.updated_at.desc())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def count_projects(self, status: Optional[str] = None) -> int:
        """Count total projects"""
        from sqlalchemy import func

        stmt = select(func.count(Project.id))
        if status:
            stmt = stmt.where(Project.status == status)

        result = await self.session.execute(stmt)
        return result.scalar() or 0
    
    async def update(self, project_id: str, update_data: Dict[str, Any]) -> Optional[Project]:
        """Update project"""
        try:
            # 首先获取项目
            project = await self.get_by_id(project_id)
            if not project:
                logger.warning(f"No project found with ID {project_id} for update")
                return None

            # 更新项目属性
            for key, value in update_data.items():
                if hasattr(project, key):
                    setattr(project, key, value)

            # 设置更新时间
            project.updated_at = time.time()

            # 提交更改
            await self.session.commit()
            await self.session.refresh(project)

            logger.info(f"Successfully updated project {project_id}")
            return project

        except Exception as e:
            logger.error(f"Error updating project {project_id}: {e}")
            await self.session.rollback()
            raise
    
    async def delete(self, project_id: str) -> bool:
        """Delete project"""
        stmt = delete(Project).where(Project.project_id == project_id)
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0


class TodoBoardRepository:
    """Repository for TodoBoard operations"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(self, board_data: Dict[str, Any]) -> TodoBoard:
        """Create a new todo board"""
        board = TodoBoard(**board_data)
        self.session.add(board)
        await self.session.commit()
        await self.session.refresh(board)
        return board
    
    async def get_by_project_id(self, project_id: str) -> Optional[TodoBoard]:
        """Get todo board by project ID"""
        stmt = select(TodoBoard).where(TodoBoard.project_id == project_id).options(
            selectinload(TodoBoard.stages)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def update(self, project_id: str, update_data: Dict[str, Any]) -> Optional[TodoBoard]:
        """Update todo board"""
        update_data['updated_at'] = time.time()
        stmt = update(TodoBoard).where(TodoBoard.project_id == project_id).values(**update_data)
        await self.session.execute(stmt)
        await self.session.commit()
        return await self.get_by_project_id(project_id)


class TodoStageRepository:
    """Repository for TodoStage operations"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create_stages(self, stages_data: List[Dict[str, Any]]) -> List[TodoStage]:
        """Create multiple stages"""
        stages = [TodoStage(**stage_data) for stage_data in stages_data]
        self.session.add_all(stages)
        await self.session.commit()
        for stage in stages:
            await self.session.refresh(stage)
        return stages
    
    async def update_stage(self, stage_id: str, update_data: Dict[str, Any]) -> bool:
        """Update a specific stage"""
        update_data['updated_at'] = time.time()
        stmt = update(TodoStage).where(TodoStage.stage_id == stage_id).values(**update_data)
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0

    async def update_stage_by_project_and_stage(self, project_id: str, stage_id: str, update_data: Dict[str, Any]) -> bool:
        """Update a specific stage by project_id and stage_id for better performance"""
        update_data['updated_at'] = time.time()
        stmt = update(TodoStage).where(
            TodoStage.project_id == project_id,
            TodoStage.stage_id == stage_id
        ).values(**update_data)
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0
    
    async def get_stages_by_board_id(self, board_id: int) -> List[TodoStage]:
        """Get all stages for a todo board"""
        stmt = select(TodoStage).where(TodoStage.todo_board_id == board_id).order_by(TodoStage.stage_index)
        result = await self.session.execute(stmt)
        return result.scalars().all()


class ProjectVersionRepository:
    """Repository for ProjectVersion operations"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(self, version_data: Dict[str, Any]) -> ProjectVersion:
        """Create a new project version"""
        version = ProjectVersion(**version_data)
        self.session.add(version)
        await self.session.commit()
        await self.session.refresh(version)
        return version
    
    async def get_versions_by_project_id(self, project_id: str) -> List[ProjectVersion]:
        """Get all versions for a project"""
        stmt = select(ProjectVersion).where(ProjectVersion.project_id == project_id).order_by(ProjectVersion.version.desc())
        result = await self.session.execute(stmt)
        return result.scalars().all()


class SlideDataRepository:
    """Repository for SlideData operations"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create_slides(self, slides_data: List[Dict[str, Any]]) -> List[SlideData]:
        """Create multiple slides"""
        slides = [SlideData(**slide_data) for slide_data in slides_data]
        self.session.add_all(slides)
        await self.session.commit()
        for slide in slides:
            await self.session.refresh(slide)
        return slides

    async def create_single_slide(self, slide_data: Dict[str, Any]) -> SlideData:
        """Create a single slide"""
        slide = SlideData(**slide_data)
        self.session.add(slide)
        await self.session.commit()
        await self.session.refresh(slide)
        return slide

    async def upsert_slide(self, project_id: str, slide_index: int, slide_data: Dict[str, Any], skip_if_user_edited: bool = False) -> SlideData:
        """Insert or update a single slide
        
        Args:
            project_id: Project ID
            slide_index: Slide index (0-based)
            slide_data: Slide data dictionary
            skip_if_user_edited: If True, skip updating slides that have is_user_edited=True.
                                 This allows generator to not overwrite user edits.
        """
        import logging
        logger = logging.getLogger(__name__)

        logger.info(f"🔄 数据库仓库开始upsert幻灯片: 项目ID={project_id}, 索引={slide_index}, 跳过用户编辑={skip_if_user_edited}")

        # Check if slide already exists
        stmt = select(SlideData).where(
            SlideData.project_id == project_id,
            SlideData.slide_index == slide_index
        )
        result = await self.session.execute(stmt)
        existing_slide = result.scalar_one_or_none()

        if existing_slide:
            # 如果skip_if_user_edited=True且现有幻灯片已被用户编辑，跳过更新
            if skip_if_user_edited and existing_slide.is_user_edited:
                logger.info(f"⏭️ 跳过更新用户编辑的幻灯片: 项目ID={project_id}, 索引={slide_index}")
                return existing_slide
            
            # Update existing slide
            logger.info(f"📝 更新现有幻灯片: 数据库ID={existing_slide.id}, 项目ID={project_id}, 索引={slide_index}")
            slide_data['updated_at'] = time.time()

            updated_fields = []
            for key, value in slide_data.items():
                if hasattr(existing_slide, key):
                    old_value = getattr(existing_slide, key)
                    if old_value != value:
                        setattr(existing_slide, key, value)
                        updated_fields.append(key)

            logger.info(f"📊 更新的字段: {updated_fields}")
            await self.session.commit()
            await self.session.refresh(existing_slide)
            logger.info(f"✅ 幻灯片更新成功: 数据库ID={existing_slide.id}")
            return existing_slide
        else:
            # Create new slide
            logger.info(f"➕ 创建新幻灯片: 项目ID={project_id}, 索引={slide_index}")
            slide_data['created_at'] = time.time()
            slide_data['updated_at'] = time.time()
            new_slide = await self.create_single_slide(slide_data)
            logger.info(f"✅ 新幻灯片创建成功: 数据库ID={new_slide.id}")
            return new_slide
    
    async def get_slides_by_project_id(self, project_id: str) -> List[SlideData]:
        """Get all slides for a project"""
        stmt = select(SlideData).where(SlideData.project_id == project_id).order_by(SlideData.slide_index)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_slide_by_index(self, project_id: str, slide_index: int) -> Optional[SlideData]:
        """Get a single slide by project_id and slide_index"""
        stmt = select(SlideData).where(
            SlideData.project_id == project_id,
            SlideData.slide_index == slide_index
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def update_slide(self, slide_id: str, update_data: Dict[str, Any]) -> bool:
        """Update a specific slide"""
        update_data['updated_at'] = time.time()
        stmt = update(SlideData).where(SlideData.slide_id == slide_id).values(**update_data)
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0
    
    async def delete_slides_by_project_id(self, project_id: str) -> bool:
        """Delete all slides for a project"""
        stmt = delete(SlideData).where(SlideData.project_id == project_id)
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0

    async def delete_slides_after_index(self, project_id: str, start_index: int) -> int:
        """Delete slides with index >= start_index for a project"""
        logger.debug(f"🗑️ 删除项目 {project_id} 中索引 >= {start_index} 的幻灯片")
        stmt = delete(SlideData).where(
            and_(
                SlideData.project_id == project_id,
                SlideData.slide_index >= start_index
            )
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        deleted_count = result.rowcount
        logger.debug(f"✅ 成功删除 {deleted_count} 张多余的幻灯片")
        return deleted_count

    async def batch_upsert_slides(self, project_id: str, slides_data: List[Dict[str, Any]]) -> bool:
        """批量插入或更新幻灯片 - 优化版本"""
        logger.debug(f"🔄 开始批量upsert幻灯片: 项目ID={project_id}, 数量={len(slides_data)}")

        try:
            # 获取现有幻灯片
            existing_slides_stmt = select(SlideData).where(SlideData.project_id == project_id)
            result = await self.session.execute(existing_slides_stmt)
            existing_slides = {slide.slide_index: slide for slide in result.scalars().all()}

            updated_count = 0
            created_count = 0
            current_time = time.time()

            # 批量处理幻灯片
            for i, slide_data in enumerate(slides_data):
                slide_index = i

                if slide_index in existing_slides:
                    # 更新现有幻灯片
                    existing_slide = existing_slides[slide_index]
                    slide_data['updated_at'] = current_time

                    # 只更新有变化的字段
                    has_changes = False
                    for key, value in slide_data.items():
                        if hasattr(existing_slide, key) and getattr(existing_slide, key) != value:
                            setattr(existing_slide, key, value)
                            has_changes = True

                    if has_changes:
                        updated_count += 1
                else:
                    # 创建新幻灯片
                    slide_data.update({
                        'project_id': project_id,
                        'slide_index': slide_index,
                        'created_at': current_time,
                        'updated_at': current_time
                    })
                    new_slide = SlideData(**slide_data)
                    self.session.add(new_slide)
                    created_count += 1

            # 一次性提交所有更改
            await self.session.commit()

            logger.debug(f"✅ 批量upsert完成: 更新={updated_count}, 创建={created_count}")
            return True

        except Exception as e:
            logger.error(f"❌ 批量upsert失败: {e}")
            await self.session.rollback()
            return False

    async def update_slide_user_edited_status(self, project_id: str, slide_index: int, is_user_edited: bool = True) -> bool:
        """Update the user edited status for a specific slide"""
        stmt = update(SlideData).where(
            SlideData.project_id == project_id,
            SlideData.slide_index == slide_index
        ).values(
            is_user_edited=is_user_edited,
            updated_at=time.time()
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0


class PPTTemplateRepository:
    """Repository for PPT template operations"""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_template(self, template_data: Dict[str, Any]) -> PPTTemplate:
        """Create a new PPT template"""
        template_data['created_at'] = time.time()
        template_data['updated_at'] = time.time()
        template = PPTTemplate(**template_data)
        self.session.add(template)
        await self.session.commit()
        await self.session.refresh(template)
        return template

    async def get_template_by_id(self, template_id: int) -> Optional[PPTTemplate]:
        """Get template by ID"""
        stmt = select(PPTTemplate).where(PPTTemplate.id == template_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_templates_by_project_id(self, project_id: str) -> List[PPTTemplate]:
        """Get all templates for a project"""
        stmt = select(PPTTemplate).where(PPTTemplate.project_id == project_id).order_by(PPTTemplate.created_at)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_templates_by_type(self, project_id: str, template_type: str) -> List[PPTTemplate]:
        """Get templates by type for a project"""
        stmt = select(PPTTemplate).where(
            PPTTemplate.project_id == project_id,
            PPTTemplate.template_type == template_type
        ).order_by(PPTTemplate.created_at)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def update_template(self, template_id: int, update_data: Dict[str, Any]) -> bool:
        """Update a template"""
        update_data['updated_at'] = time.time()
        stmt = update(PPTTemplate).where(PPTTemplate.id == template_id).values(**update_data)
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0

    async def increment_usage_count(self, template_id: int) -> bool:
        """Increment template usage count"""
        stmt = update(PPTTemplate).where(PPTTemplate.id == template_id).values(
            usage_count=PPTTemplate.usage_count + 1,
            updated_at=time.time()
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0

    async def delete_template(self, template_id: int) -> bool:
        """Delete a template"""
        stmt = delete(PPTTemplate).where(PPTTemplate.id == template_id)
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0


class GlobalMasterTemplateRepository:
    """Repository for Global Master Template operations"""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_template(self, template_data: Dict[str, Any]) -> GlobalMasterTemplate:
        """Create a new global master template"""
        template_data['created_at'] = time.time()
        template_data['updated_at'] = time.time()
        template = GlobalMasterTemplate(**template_data)
        self.session.add(template)
        await self.session.commit()
        await self.session.refresh(template)
        return template

    async def get_template_by_id(self, template_id: int) -> Optional[GlobalMasterTemplate]:
        """Get template by ID"""
        stmt = select(GlobalMasterTemplate).where(GlobalMasterTemplate.id == template_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_template_by_name(self, template_name: str) -> Optional[GlobalMasterTemplate]:
        """Get template by name"""
        stmt = select(GlobalMasterTemplate).where(GlobalMasterTemplate.template_name == template_name)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all_templates(self, active_only: bool = True) -> List[GlobalMasterTemplate]:
        """Get all global master templates"""
        stmt = select(GlobalMasterTemplate)
        if active_only:
            stmt = stmt.where(GlobalMasterTemplate.is_active == True)
        stmt = stmt.order_by(GlobalMasterTemplate.is_default.desc(), GlobalMasterTemplate.usage_count.desc())
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_templates_by_tags(self, tags: List[str], active_only: bool = True) -> List[GlobalMasterTemplate]:
        """Get templates by tags"""
        stmt = select(GlobalMasterTemplate)
        if active_only:
            stmt = stmt.where(GlobalMasterTemplate.is_active == True)

        # Filter by tags (any tag matches)
        for tag in tags:
            stmt = stmt.where(GlobalMasterTemplate.tags.contains([tag]))

        stmt = stmt.order_by(GlobalMasterTemplate.usage_count.desc())
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_templates_paginated(
        self,
        active_only: bool = True,
        offset: int = 0,
        limit: int = 6,
        search: Optional[str] = None
    ) -> Tuple[List[GlobalMasterTemplate], int]:
        """Get templates with pagination"""
        from sqlalchemy import func, or_

        # Base query
        stmt = select(GlobalMasterTemplate)
        count_stmt = select(func.count(GlobalMasterTemplate.id))

        if active_only:
            stmt = stmt.where(GlobalMasterTemplate.is_active == True)
            count_stmt = count_stmt.where(GlobalMasterTemplate.is_active == True)

        # Add search filter
        if search and search.strip():
            search_filter = or_(
                GlobalMasterTemplate.template_name.ilike(f"%{search}%"),
                GlobalMasterTemplate.description.ilike(f"%{search}%")
            )
            stmt = stmt.where(search_filter)
            count_stmt = count_stmt.where(search_filter)

        # Order and paginate
        stmt = stmt.order_by(
            GlobalMasterTemplate.is_default.desc(),
            GlobalMasterTemplate.usage_count.desc()
        ).offset(offset).limit(limit)

        # Execute queries
        result = await self.session.execute(stmt)
        count_result = await self.session.execute(count_stmt)

        templates = result.scalars().all()
        total_count = count_result.scalar()

        return templates, total_count

    async def get_templates_by_tags_paginated(
        self,
        tags: List[str],
        active_only: bool = True,
        offset: int = 0,
        limit: int = 6,
        search: Optional[str] = None
    ) -> Tuple[List[GlobalMasterTemplate], int]:
        """Get templates by tags with pagination"""
        from sqlalchemy import func, or_

        # Base query
        stmt = select(GlobalMasterTemplate)
        count_stmt = select(func.count(GlobalMasterTemplate.id))

        if active_only:
            stmt = stmt.where(GlobalMasterTemplate.is_active == True)
            count_stmt = count_stmt.where(GlobalMasterTemplate.is_active == True)

        # Filter by tags (any tag matches)
        for tag in tags:
            tag_filter = GlobalMasterTemplate.tags.contains([tag])
            stmt = stmt.where(tag_filter)
            count_stmt = count_stmt.where(tag_filter)

        # Add search filter
        if search and search.strip():
            search_filter = or_(
                GlobalMasterTemplate.template_name.ilike(f"%{search}%"),
                GlobalMasterTemplate.description.ilike(f"%{search}%")
            )
            stmt = stmt.where(search_filter)
            count_stmt = count_stmt.where(search_filter)

        # Order and paginate
        stmt = stmt.order_by(GlobalMasterTemplate.usage_count.desc()).offset(offset).limit(limit)

        # Execute queries
        result = await self.session.execute(stmt)
        count_result = await self.session.execute(count_stmt)

        templates = result.scalars().all()
        total_count = count_result.scalar()

        return templates, total_count

    async def update_template(self, template_id: int, update_data: Dict[str, Any]) -> bool:
        """Update a global master template"""
        update_data['updated_at'] = time.time()
        stmt = update(GlobalMasterTemplate).where(GlobalMasterTemplate.id == template_id).values(**update_data)
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0

    async def delete_template(self, template_id: int) -> bool:
        """Delete a global master template"""
        try:
            stmt = delete(GlobalMasterTemplate).where(GlobalMasterTemplate.id == template_id)
            result = await self.session.execute(stmt)
            await self.session.commit()

            rows_affected = result.rowcount
            logger.info(f"Delete operation for template {template_id}: {rows_affected} rows affected")

            return rows_affected > 0
        except Exception as e:
            logger.error(f"Error deleting template {template_id}: {e}")
            await self.session.rollback()
            raise

    async def increment_usage_count(self, template_id: int) -> bool:
        """Increment template usage count"""
        stmt = update(GlobalMasterTemplate).where(GlobalMasterTemplate.id == template_id).values(
            usage_count=GlobalMasterTemplate.usage_count + 1,
            updated_at=time.time()
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0

    async def set_default_template(self, template_id: int) -> bool:
        """Set a template as default (and unset others)"""
        # First, unset all default templates
        stmt = update(GlobalMasterTemplate).values(is_default=False, updated_at=time.time())
        await self.session.execute(stmt)

        # Then set the specified template as default
        stmt = update(GlobalMasterTemplate).where(GlobalMasterTemplate.id == template_id).values(
            is_default=True,
            updated_at=time.time()
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0

    async def get_default_template(self) -> Optional[GlobalMasterTemplate]:
        """Get the default template"""
        stmt = select(GlobalMasterTemplate).where(
            GlobalMasterTemplate.is_default == True,
            GlobalMasterTemplate.is_active == True
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()



    async def delete_templates_by_project_id(self, project_id: str) -> bool:
        """Delete all templates for a project"""
        stmt = delete(PPTTemplate).where(PPTTemplate.project_id == project_id)
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0
