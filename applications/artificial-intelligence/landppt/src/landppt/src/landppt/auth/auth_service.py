"""
Authentication service for LandPPT
"""

import time
import secrets
import hashlib
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..database.models import User, UserSession
from ..database.database import get_db
from ..core.config import app_config


class AuthService:
    """Authentication service"""

    def __init__(self):
        self.session_expire_minutes = app_config.access_token_expire_minutes

    def _get_current_expire_minutes(self) -> int:
        """Get current session expire minutes from config (for real-time updates)"""
        return app_config.access_token_expire_minutes
    
    def create_user(self, db: Session, username: str, password: str, email: Optional[str] = None, is_admin: bool = False) -> User:
        """Create a new user"""
        # Check if user already exists
        existing_user = db.query(User).filter(User.username == username).first()
        if existing_user:
            raise ValueError("用户名已存在")
        
        if email:
            existing_email = db.query(User).filter(User.email == email).first()
            if existing_email:
                raise ValueError("邮箱已存在")
        
        # Create new user
        user = User(
            username=username,
            email=email,
            is_admin=is_admin
        )
        user.set_password(password)
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return user
    
    def authenticate_user(self, db: Session, username: str, password: str) -> Optional[User]:
        """Authenticate user with username and password"""
        user = db.query(User).filter(
            and_(User.username == username, User.is_active == True)
        ).first()
        
        if user and user.check_password(password):
            # Update last login time
            user.last_login = time.time()
            db.commit()
            return user
        
        return None
    
    def create_session(self, db: Session, user: User) -> str:
        """Create a new session for user"""
        # Generate session ID
        session_id = secrets.token_urlsafe(64)

        # Get current expire minutes (for real-time config updates)
        current_expire_minutes = self._get_current_expire_minutes()

        # Calculate expiration time
        # If session_expire_minutes is 0, set to a very far future date (never expire)
        if current_expire_minutes == 0:
            # Set expiration to year 2099 (effectively never expires)
            expires_at = time.mktime(time.strptime("2099-12-31 23:59:59", "%Y-%m-%d %H:%M:%S"))
        else:
            expires_at = time.time() + (current_expire_minutes * 60)

        # Create session record
        session = UserSession(
            session_id=session_id,
            user_id=user.id,
            expires_at=expires_at
        )

        db.add(session)
        db.commit()

        return session_id
    
    def get_user_by_session(self, db: Session, session_id: str) -> Optional[User]:
        """Get user by session ID"""
        session = db.query(UserSession).filter(
            and_(
                UserSession.session_id == session_id,
                UserSession.is_active == True
            )
        ).first()
        
        if not session or session.is_expired():
            if session:
                # Mark session as inactive
                session.is_active = False
                db.commit()
            return None
        
        return session.user
    
    def logout_user(self, db: Session, session_id: str) -> bool:
        """Logout user by deactivating session"""
        session = db.query(UserSession).filter(
            UserSession.session_id == session_id
        ).first()
        
        if session:
            session.is_active = False
            db.commit()
            return True
        
        return False
    
    def cleanup_expired_sessions(self, db: Session) -> int:
        """Clean up expired sessions"""
        current_time = time.time()
        # Don't clean up sessions that are set to never expire (year 2099 or later)
        year_2099_timestamp = time.mktime(time.strptime("2099-01-01 00:00:00", "%Y-%m-%d %H:%M:%S"))

        expired_sessions = db.query(UserSession).filter(
            and_(
                UserSession.expires_at < current_time,
                UserSession.expires_at < year_2099_timestamp  # Exclude never-expire sessions
            )
        ).all()

        count = len(expired_sessions)
        for session in expired_sessions:
            session.is_active = False

        db.commit()
        return count
    
    def get_user_by_id(self, db: Session, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return db.query(User).filter(
            and_(User.id == user_id, User.is_active == True)
        ).first()
    
    def get_user_by_username(self, db: Session, username: str) -> Optional[User]:
        """Get user by username"""
        return db.query(User).filter(
            and_(User.username == username, User.is_active == True)
        ).first()
    
    def update_user_password(self, db: Session, user: User, new_password: str) -> bool:
        """Update user password"""
        try:
            user.set_password(new_password)
            db.commit()
            return True
        except Exception:
            db.rollback()
            return False
    
    def deactivate_user(self, db: Session, user: User) -> bool:
        """Deactivate user account"""
        try:
            user.is_active = False
            # Deactivate all user sessions
            sessions = db.query(UserSession).filter(UserSession.user_id == user.id).all()
            for session in sessions:
                session.is_active = False
            db.commit()
            return True
        except Exception:
            db.rollback()
            return False
    
    def list_users(self, db: Session, skip: int = 0, limit: int = 100) -> list[User]:
        """List all users"""
        return db.query(User).offset(skip).limit(limit).all()
    
    def get_user_sessions(self, db: Session, user: User) -> list[UserSession]:
        """Get all active sessions for a user"""
        return db.query(UserSession).filter(
            and_(
                UserSession.user_id == user.id,
                UserSession.is_active == True
            )
        ).all()


# Global auth service instance
auth_service = AuthService()


def get_auth_service() -> AuthService:
    """Get auth service instance"""
    return auth_service


def init_default_admin(db: Session) -> None:
    """Initialize default admin user if no users exist"""
    user_count = db.query(User).count()
    
    if user_count == 0:
        # Create default admin user
        default_username = "admin"
        default_password = "admin123"
        
        try:
            auth_service.create_user(
                db=db,
                username=default_username,
                password=default_password,
                is_admin=True
            )
            print(f"默认管理员账户已创建: {default_username} / {default_password}")
            print("请及时修改默认密码！")
        except Exception as e:
            print(f"创建默认管理员账户失败: {e}")


def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return hash_password(password) == hashed
