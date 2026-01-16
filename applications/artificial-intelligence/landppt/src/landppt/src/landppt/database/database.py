"""
Database configuration and session management
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from ..core.config import app_config

# Create database URL
DATABASE_URL = app_config.database_url

# For async SQLite, we need to use aiosqlite
if DATABASE_URL.startswith("sqlite:///"):
    ASYNC_DATABASE_URL = DATABASE_URL.replace("sqlite:///", "sqlite+aiosqlite:///")
else:
    ASYNC_DATABASE_URL = DATABASE_URL

# Create engines
# SQLite-specific configuration for better concurrency
sqlite_connect_args = {
    "check_same_thread": False,
    "timeout": 30,  # Wait up to 30 seconds for lock
} if "sqlite" in DATABASE_URL else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=sqlite_connect_args,
    echo=False,  # Disable SQL logging to reduce noise
    pool_pre_ping=True,  # Verify connections before using
    pool_size=100,  # Larger pool for better concurrency
    max_overflow=200  # Allow overflow connections
)

async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=False,  # Disable SQL logging to reduce noise
    pool_pre_ping=True,
    connect_args={"timeout": 30} if "sqlite" in ASYNC_DATABASE_URL else {}
)

# Create session makers
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False  # Prevent errors after commit
)
AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_async_db():
    """Dependency to get async database session"""
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    """Initialize database tables"""
    # Import here to avoid circular imports
    from .models import Base

    async with async_engine.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)

    # Initialize default admin user
    from ..auth.auth_service import init_default_admin
    db = SessionLocal()
    try:
        init_default_admin(db)
    finally:
        db.close()


async def close_db():
    """Close database connections"""
    await async_engine.dispose()

