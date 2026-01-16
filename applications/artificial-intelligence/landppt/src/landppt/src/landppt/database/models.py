"""
SQLAlchemy database models for LandPPT
"""

import time
import hashlib
from typing import Dict, Any, List, Optional
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


class User(Base):
    """User model for authentication"""
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(100), unique=True, index=True, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[float] = mapped_column(Float, default=time.time)
    last_login: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    def set_password(self, password: str):
        """Set password hash"""
        self.password_hash = hashlib.sha256(password.encode()).hexdigest()

    def check_password(self, password: str) -> bool:
        """Check if password is correct"""
        return self.password_hash == hashlib.sha256(password.encode()).hexdigest()

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "is_active": self.is_active,
            "is_admin": self.is_admin,
            "created_at": self.created_at,
            "last_login": self.last_login
        }


class UserSession(Base):
    """User session model"""
    __tablename__ = "user_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[float] = mapped_column(Float, default=time.time)
    expires_at: Mapped[float] = mapped_column(Float, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationship
    user: Mapped["User"] = relationship("User")

    def is_expired(self) -> bool:
        """Check if session is expired"""
        # If expires_at is set to year 2099 or later, consider it as never expires
        year_2099_timestamp = time.mktime(time.strptime("2099-01-01 00:00:00", "%Y-%m-%d %H:%M:%S"))
        if self.expires_at >= year_2099_timestamp:
            return False
        return time.time() > self.expires_at


class Project(Base):
    """Project model for storing PPT projects"""
    __tablename__ = "projects"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    project_id: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    scenario: Mapped[str] = mapped_column(String(100), nullable=False)
    topic: Mapped[str] = mapped_column(String(255), nullable=False)
    requirements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="draft")
    outline: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    slides_html: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    slides_data: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(JSON, nullable=True)
    confirmed_requirements: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    project_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)  # 项目元数据，包括选择的模板ID等
    version: Mapped[int] = mapped_column(Integer, default=1)
    share_token: Mapped[Optional[str]] = mapped_column(String(64), unique=True, index=True, nullable=True)  # 分享token，用于公开访问
    share_enabled: Mapped[bool] = mapped_column(Boolean, default=False)  # 是否启用分享
    created_at: Mapped[float] = mapped_column(Float, default=time.time)
    updated_at: Mapped[float] = mapped_column(Float, default=time.time, onupdate=time.time)
    
    # Relationships
    todo_board: Mapped[Optional["TodoBoard"]] = relationship("TodoBoard", back_populates="project", uselist=False)
    versions: Mapped[List["ProjectVersion"]] = relationship("ProjectVersion", back_populates="project")
    slides: Mapped[List["SlideData"]] = relationship("SlideData", back_populates="project")
    speech_scripts: Mapped[List["SpeechScript"]] = relationship("SpeechScript", back_populates="project")


class TodoBoard(Base):
    """TODO Board model for project workflow management"""
    __tablename__ = "todo_boards"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.project_id"), unique=True)
    current_stage_index: Mapped[int] = mapped_column(Integer, default=0)
    overall_progress: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[float] = mapped_column(Float, default=time.time)
    updated_at: Mapped[float] = mapped_column(Float, default=time.time, onupdate=time.time)
    
    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="todo_board")
    stages: Mapped[List["TodoStage"]] = relationship("TodoStage", back_populates="todo_board", order_by="TodoStage.stage_index")


class TodoStage(Base):
    """TODO Stage model for individual workflow stages"""
    __tablename__ = "todo_stages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    todo_board_id: Mapped[int] = mapped_column(Integer, ForeignKey("todo_boards.id"))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.project_id"), index=True)  # Added for direct project reference
    stage_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)  # Added index for better performance
    stage_index: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending", index=True)  # Added index for status queries
    progress: Mapped[float] = mapped_column(Float, default=0.0)
    result: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[float] = mapped_column(Float, default=time.time)
    updated_at: Mapped[float] = mapped_column(Float, default=time.time, onupdate=time.time)

    # Relationships
    todo_board: Mapped["TodoBoard"] = relationship("TodoBoard", back_populates="stages")
    project: Mapped["Project"] = relationship("Project", foreign_keys=[project_id])  # Direct project relationship


class ProjectVersion(Base):
    """Project version model for version control"""
    __tablename__ = "project_versions"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.project_id"))
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    timestamp: Mapped[float] = mapped_column(Float, default=time.time)
    data: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    
    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="versions")


class SlideData(Base):
    """Slide data model for individual PPT slides"""
    __tablename__ = "slide_data"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.project_id"))
    slide_index: Mapped[int] = mapped_column(Integer, nullable=False)
    slide_id: Mapped[str] = mapped_column(String(100), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str] = mapped_column(String(50), nullable=False)
    html_content: Mapped[str] = mapped_column(Text, nullable=False)
    slide_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    template_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("ppt_templates.id"), nullable=True)
    is_user_edited: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[float] = mapped_column(Float, default=time.time)
    updated_at: Mapped[float] = mapped_column(Float, default=time.time, onupdate=time.time)

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="slides")
    template: Mapped[Optional["PPTTemplate"]] = relationship("PPTTemplate", back_populates="slides")


class PPTTemplate(Base):
    """PPT Template model for storing master templates"""
    __tablename__ = "ppt_templates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.project_id"))
    template_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # title, content, chart, image, summary
    template_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    html_template: Mapped[str] = mapped_column(Text, nullable=False)
    applicable_scenarios: Mapped[List[str]] = mapped_column(JSON, nullable=True)  # 适用场景
    style_config: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)  # 样式配置
    usage_count: Mapped[int] = mapped_column(Integer, default=0)  # 使用次数统计
    created_at: Mapped[float] = mapped_column(Float, default=time.time)
    updated_at: Mapped[float] = mapped_column(Float, default=time.time, onupdate=time.time)

    # Relationships
    project: Mapped["Project"] = relationship("Project", foreign_keys=[project_id])
    slides: Mapped[List["SlideData"]] = relationship("SlideData", back_populates="template")


class GlobalMasterTemplate(Base):
    """Global Master Template model for storing reusable master templates"""
    __tablename__ = "global_master_templates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    template_name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    html_template: Mapped[str] = mapped_column(Text, nullable=False)
    preview_image: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Base64 encoded preview image
    style_config: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)  # 样式配置
    tags: Mapped[List[str]] = mapped_column(JSON, nullable=True)  # 标签分类
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)  # 是否为默认模板
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)  # 是否启用
    usage_count: Mapped[int] = mapped_column(Integer, default=0)  # 使用次数统计
    created_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # 创建者
    created_at: Mapped[float] = mapped_column(Float, default=time.time)
    updated_at: Mapped[float] = mapped_column(Float, default=time.time, onupdate=time.time)


class SpeechScript(Base):
    """演讲稿存储表"""
    __tablename__ = "speech_scripts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.project_id"), nullable=False, index=True)
    slide_index: Mapped[int] = mapped_column(Integer, nullable=False)
    slide_title: Mapped[str] = mapped_column(String(255), nullable=False)
    script_content: Mapped[str] = mapped_column(Text, nullable=False)
    estimated_duration: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    speaker_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # 生成参数
    generation_type: Mapped[str] = mapped_column(String(20), nullable=False)  # single, multi, full
    tone: Mapped[str] = mapped_column(String(50), nullable=False)
    target_audience: Mapped[str] = mapped_column(String(100), nullable=False)
    custom_audience: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # 自定义受众描述
    language_complexity: Mapped[str] = mapped_column(String(20), nullable=False)
    speaking_pace: Mapped[str] = mapped_column(String(20), nullable=False)
    custom_style_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    include_transitions: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    include_timing_notes: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # 时间戳
    created_at: Mapped[float] = mapped_column(Float, default=time.time, nullable=False)
    updated_at: Mapped[float] = mapped_column(Float, default=time.time, onupdate=time.time, nullable=False)

    # 关联关系
    project: Mapped["Project"] = relationship("Project", back_populates="speech_scripts")

    def __repr__(self):
        return f"<SpeechScript(id={self.id}, project_id='{self.project_id}', slide_index={self.slide_index})>"
