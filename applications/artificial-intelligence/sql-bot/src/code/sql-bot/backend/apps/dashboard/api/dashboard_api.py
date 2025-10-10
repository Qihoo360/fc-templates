from fastapi import APIRouter, File, UploadFile, HTTPException

from apps.dashboard.crud.dashboard_service import list_resource, load_resource, \
    create_resource, create_canvas, validate_name, delete_resource, update_resource, update_canvas
from apps.dashboard.models.dashboard_model import CreateDashboard, BaseDashboard, QueryDashboard, DashboardResponse
from common.core.deps import SessionDep, CurrentUser

router = APIRouter(tags=["dashboard"], prefix="/dashboard")


@router.post("/list_resource")
async def list_resource_api(session: SessionDep, dashboard: QueryDashboard, current_user: CurrentUser):
    return list_resource(session=session, dashboard=dashboard, current_user=current_user)


@router.post("/load_resource")
async def load_resource_api(session: SessionDep, dashboard: QueryDashboard):
    return load_resource(session=session, dashboard=dashboard)


@router.post("/create_resource", response_model=BaseDashboard)
async def create_resource_api(session: SessionDep, user: CurrentUser, dashboard: CreateDashboard):
    return create_resource(session, user, dashboard)


@router.post("/update_resource", response_model=BaseDashboard)
async def update_resource_api(session: SessionDep, user: CurrentUser, dashboard: QueryDashboard):
    return update_resource(session=session, user=user, dashboard=dashboard)


@router.delete("/delete_resource/{resource_id}")
async def delete_resource_api(session: SessionDep, resource_id: str):
    return delete_resource(session, resource_id)


@router.post("/create_canvas", response_model=BaseDashboard)
async def create_canvas_api(session: SessionDep, user: CurrentUser, dashboard: CreateDashboard):
    return create_canvas(session, user, dashboard)


@router.post("/update_canvas", response_model=BaseDashboard)
async def update_canvas_api(session: SessionDep, user: CurrentUser, dashboard: CreateDashboard):
    return update_canvas(session, user, dashboard)


@router.post("/check_name")
async def check_name_api(session: SessionDep, user: CurrentUser, dashboard: QueryDashboard):
    return validate_name(session, user, dashboard)
