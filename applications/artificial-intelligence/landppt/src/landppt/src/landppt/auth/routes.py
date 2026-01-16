"""
Authentication routes for LandPPT
"""

from fastapi import APIRouter, Request, Form, Depends, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
import logging

from .auth_service import get_auth_service, AuthService
from .middleware import get_current_user_optional, get_current_user_required, get_current_user
from ..database.database import get_db
from ..database.models import User

logger = logging.getLogger(__name__)

router = APIRouter()
templates = Jinja2Templates(directory="src/landppt/web/templates")


@router.get("/auth/login", response_class=HTMLResponse)
async def login_page(
    request: Request,
    error: str = None,
    success: str = None,
    username: str = None
):
    """Login page"""
    # Check if user is already logged in using request.state.user set by middleware
    user = get_current_user(request)
    if user:
        return RedirectResponse(url="/dashboard", status_code=302)

    return templates.TemplateResponse("login.html", {
        "request": request,
        "error": error,
        "success": success,
        "username": username
    })


@router.post("/auth/login")
async def login(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Handle login form submission"""
    try:
        # Authenticate user
        user = auth_service.authenticate_user(db, username, password)
        
        if not user:
            return templates.TemplateResponse("login.html", {
                "request": request,
                "error": "用户名或密码错误",
                "username": username
            })
        
        # Create session
        session_id = auth_service.create_session(db, user)
        
        # Redirect to dashboard
        response = RedirectResponse(url="/dashboard", status_code=302)

        # Set cookie max_age based on session expiration
        # If session_expire_minutes is 0, set cookie to never expire (None means session cookie)
        current_expire_minutes = auth_service._get_current_expire_minutes()
        cookie_max_age = None if current_expire_minutes == 0 else current_expire_minutes * 60

        response.set_cookie(
            key="session_id",
            value=session_id,
            max_age=cookie_max_age,
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite="lax"
        )
        
        logger.info(f"User {username} logged in successfully")
        return response
        
    except Exception as e:
        logger.error(f"Login error: {e}")
        return templates.TemplateResponse("login.html", {
            "request": request,
            "error": "登录过程中发生错误，请重试",
            "username": username
        })


@router.get("/auth/logout")
async def logout(
    request: Request,
    db: Session = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Logout user"""
    session_id = request.cookies.get("session_id")
    
    if session_id:
        auth_service.logout_user(db, session_id)
    
    response = RedirectResponse(url="/auth/login?success=已成功退出登录", status_code=302)
    response.delete_cookie("session_id")
    
    return response


@router.get("/auth/profile", response_class=HTMLResponse)
async def profile_page(
    request: Request,
    user: User = Depends(get_current_user_required)
):
    """User profile page"""
    return templates.TemplateResponse("profile.html", {
        "request": request,
        "user": user.to_dict()
    })


@router.post("/auth/change-password")
async def change_password(
    request: Request,
    current_password: str = Form(...),
    new_password: str = Form(...),
    confirm_password: str = Form(...),
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Change user password"""
    try:
        # Validate current password
        if not user.check_password(current_password):
            return templates.TemplateResponse("profile.html", {
                "request": request,
                "user": user.to_dict(),
                "error": "当前密码错误"
            })
        
        # Validate new password
        if new_password != confirm_password:
            return templates.TemplateResponse("profile.html", {
                "request": request,
                "user": user.to_dict(),
                "error": "新密码和确认密码不匹配"
            })
        
        if len(new_password) < 6:
            return templates.TemplateResponse("profile.html", {
                "request": request,
                "user": user.to_dict(),
                "error": "密码长度至少6位"
            })
        
        # Update password
        if auth_service.update_user_password(db, user, new_password):
            return templates.TemplateResponse("profile.html", {
                "request": request,
                "user": user.to_dict(),
                "success": "密码修改成功"
            })
        else:
            return templates.TemplateResponse("profile.html", {
                "request": request,
                "user": user.to_dict(),
                "error": "密码修改失败，请重试"
            })
            
    except Exception as e:
        logger.error(f"Change password error: {e}")
        return templates.TemplateResponse("profile.html", {
            "request": request,
            "user": user.to_dict(),
            "error": "修改密码过程中发生错误"
        })


# API endpoints for authentication
@router.post("/api/auth/login")
async def api_login(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service)
):
    """API login endpoint"""
    user = auth_service.authenticate_user(db, username, password)
    
    if not user:
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    
    session_id = auth_service.create_session(db, user)
    
    return {
        "success": True,
        "session_id": session_id,
        "user": user.to_dict()
    }


@router.post("/api/auth/logout")
async def api_logout(
    request: Request,
    db: Session = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service)
):
    """API logout endpoint"""
    session_id = request.cookies.get("session_id")
    
    if session_id:
        auth_service.logout_user(db, session_id)
    
    return {"success": True, "message": "已成功退出登录"}


@router.get("/api/auth/me")
async def api_current_user(
    user: User = Depends(get_current_user_required)
):
    """Get current user info"""
    return {
        "success": True,
        "user": user.to_dict()
    }


@router.get("/api/auth/check")
async def api_check_auth(
    request: Request,
    db: Session = Depends(get_db)
):
    """Check authentication status"""
    user = get_current_user_optional(request, db)
    
    return {
        "authenticated": user is not None,
        "user": user.to_dict() if user else None
    }
