"""
Database migration utilities for LandPPT
"""

import os
import time
import logging
from typing import List, Dict, Any
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from .database import AsyncSessionLocal, async_engine
from .models import Base

logger = logging.getLogger(__name__)


class DatabaseMigration:
    """Database migration manager"""
    
    def __init__(self):
        self.migrations = []
        self._register_migrations()
    
    def _register_migrations(self):
        """Register all available migrations"""
        # Migration 001: Initial schema
        self.migrations.append({
            "version": "001",
            "name": "initial_schema",
            "description": "Create initial database schema",
            "up": self._migration_001_up,
            "down": self._migration_001_down
        })
        
        # Migration 002: Add indexes
        self.migrations.append({
            "version": "002",
            "name": "add_indexes",
            "description": "Add performance indexes",
            "up": self._migration_002_up,
            "down": self._migration_002_down
        })

        # Migration 003: Add project_id to todo_stages
        self.migrations.append({
            "version": "003",
            "name": "add_project_id_to_todo_stages",
            "description": "Add project_id column to todo_stages table for better indexing",
            "up": self._migration_003_up,
            "down": self._migration_003_down
        })

        # Migration 004: Add PPT templates table
        self.migrations.append({
            "version": "004",
            "name": "add_ppt_templates_table",
            "description": "Add PPT templates table and update slide_data table",
            "up": self._migration_004_up,
            "down": self._migration_004_down
        })

        # Migration 005: Add project_metadata column to projects table
        self.migrations.append({
            "version": "005",
            "name": "add_project_metadata_to_projects",
            "description": "Add project_metadata column to projects table for storing template selection and other metadata",
            "up": self._migration_005_up,
            "down": self._migration_005_down
        })

        # Migration 006: Add is_user_edited field to slide_data table
        self.migrations.append({
            "version": "006",
            "name": "add_is_user_edited_to_slide_data",
            "description": "Add is_user_edited field to slide_data table to track user manual edits",
            "up": self._migration_006_up,
            "down": self._migration_006_down
        })
    
    async def _migration_001_up(self, session: AsyncSession):
        """Create initial schema"""
        logger.info("Running migration 001: Creating initial schema")
        
        # Create all tables
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        logger.info("Migration 001 completed successfully")
    
    async def _migration_001_down(self, session: AsyncSession):
        """Drop initial schema"""
        logger.info("Rolling back migration 001: Dropping all tables")
        
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        
        logger.info("Migration 001 rollback completed")
    
    async def _migration_002_up(self, session: AsyncSession):
        """Add performance indexes"""
        logger.info("Running migration 002: Adding performance indexes")
        
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)",
            "CREATE INDEX IF NOT EXISTS idx_projects_scenario ON projects(scenario)",
            "CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at)",
            "CREATE INDEX IF NOT EXISTS idx_todo_stages_status ON todo_stages(status)",
            "CREATE INDEX IF NOT EXISTS idx_slide_data_slide_index ON slide_data(slide_index)",
            "CREATE INDEX IF NOT EXISTS idx_project_versions_timestamp ON project_versions(timestamp)"
        ]
        
        for index_sql in indexes:
            await session.execute(text(index_sql))
        
        await session.commit()
        logger.info("Migration 002 completed successfully")
    
    async def _migration_002_down(self, session: AsyncSession):
        """Remove performance indexes"""
        logger.info("Rolling back migration 002: Removing performance indexes")
        
        indexes = [
            "DROP INDEX IF EXISTS idx_projects_status",
            "DROP INDEX IF EXISTS idx_projects_scenario", 
            "DROP INDEX IF EXISTS idx_projects_created_at",
            "DROP INDEX IF EXISTS idx_todo_stages_status",
            "DROP INDEX IF EXISTS idx_slide_data_slide_index",
            "DROP INDEX IF EXISTS idx_project_versions_timestamp"
        ]
        
        for index_sql in indexes:
            await session.execute(text(index_sql))
        
        await session.commit()
        logger.info("Migration 002 rollback completed")

    async def _migration_003_up(self, session: AsyncSession):
        """Add project_id column to todo_stages table"""
        logger.info("Running migration 003: Adding project_id to todo_stages")

        try:
            # Check if project_id column already exists
            result = await session.execute(text("""
                PRAGMA table_info(todo_stages)
            """))
            columns = result.fetchall()
            column_names = [col[1] for col in columns]

            if 'project_id' not in column_names:
                # Add project_id column to todo_stages table
                await session.execute(text("""
                    ALTER TABLE todo_stages
                    ADD COLUMN project_id VARCHAR(36)
                """))
                logger.info("Added project_id column to todo_stages")
            else:
                logger.info("project_id column already exists in todo_stages")

            # Create index on project_id
            await session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_todo_stages_project_id
                ON todo_stages(project_id)
            """))

            # Create index on stage_id for better performance
            await session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_todo_stages_stage_id
                ON todo_stages(stage_id)
            """))

            # Populate project_id for existing records
            await session.execute(text("""
                UPDATE todo_stages
                SET project_id = (
                    SELECT tb.project_id
                    FROM todo_boards tb
                    WHERE tb.id = todo_stages.todo_board_id
                )
                WHERE project_id IS NULL
            """))

            await session.commit()
            logger.info("Migration 003 completed successfully")

        except Exception as e:
            await session.rollback()
            logger.error(f"Migration 003 failed: {e}")
            raise

    async def _migration_003_down(self, session: AsyncSession):
        """Remove project_id column from todo_stages table"""
        logger.info("Rolling back migration 003: Removing project_id from todo_stages")

        try:
            # Drop indexes first
            await session.execute(text("DROP INDEX IF EXISTS idx_todo_stages_project_id"))
            await session.execute(text("DROP INDEX IF EXISTS idx_todo_stages_stage_id"))

            # Remove project_id column (SQLite doesn't support DROP COLUMN directly)
            # We need to recreate the table without the column
            await session.execute(text("""
                CREATE TABLE todo_stages_backup AS
                SELECT id, todo_board_id, stage_id, stage_index, title, description,
                       status, progress, result, created_at, updated_at
                FROM todo_stages
            """))

            await session.execute(text("DROP TABLE todo_stages"))

            await session.execute(text("""
                CREATE TABLE todo_stages (
                    id INTEGER PRIMARY KEY,
                    todo_board_id INTEGER NOT NULL,
                    stage_id VARCHAR(100) NOT NULL,
                    stage_index INTEGER NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    description TEXT NOT NULL,
                    status VARCHAR(50) DEFAULT 'pending',
                    progress FLOAT DEFAULT 0.0,
                    result JSON,
                    created_at FLOAT,
                    updated_at FLOAT,
                    FOREIGN KEY (todo_board_id) REFERENCES todo_boards(id)
                )
            """))

            await session.execute(text("""
                INSERT INTO todo_stages
                SELECT * FROM todo_stages_backup
            """))

            await session.execute(text("DROP TABLE todo_stages_backup"))

            await session.commit()
            logger.info("Migration 003 rollback completed")

        except Exception as e:
            await session.rollback()
            logger.error(f"Migration 003 rollback failed: {e}")
            raise

    async def _migration_004_up(self, session: AsyncSession):
        """Migration 004: Add PPT templates table and update slide_data table"""
        try:
            logger.info("Running migration 004: Adding PPT templates table")

            # Create ppt_templates table
            create_templates_table_sql = """
            CREATE TABLE IF NOT EXISTS ppt_templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id VARCHAR(36) NOT NULL,
                template_type VARCHAR(50) NOT NULL,
                template_name VARCHAR(255) NOT NULL,
                description TEXT,
                html_template TEXT NOT NULL,
                applicable_scenarios JSON,
                style_config JSON,
                usage_count INTEGER DEFAULT 0,
                created_at FLOAT NOT NULL,
                updated_at FLOAT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects (project_id)
            )
            """

            await session.execute(text(create_templates_table_sql))

            # Create indexes for ppt_templates
            await session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_ppt_templates_project_id
                ON ppt_templates (project_id)
            """))

            await session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_ppt_templates_type
                ON ppt_templates (template_type)
            """))

            # Add template_id column to slide_data table
            try:
                await session.execute(text("""
                    ALTER TABLE slide_data
                    ADD COLUMN template_id INTEGER REFERENCES ppt_templates(id)
                """))
            except Exception as e:
                # Column might already exist, check if it's a duplicate column error
                if "duplicate column name" not in str(e).lower():
                    raise
                logger.info("template_id column already exists in slide_data table")

            await session.commit()
            logger.info("Migration 004 completed successfully")

        except Exception as e:
            await session.rollback()
            logger.error(f"Migration 004 failed: {e}")
            raise

    async def _migration_004_down(self, session: AsyncSession):
        """Migration 004 rollback: Remove PPT templates table and template_id column"""
        try:
            logger.info("Rolling back migration 004")

            # Drop ppt_templates table
            await session.execute(text("DROP TABLE IF EXISTS ppt_templates"))

            # Remove template_id column from slide_data table
            # SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
            await session.execute(text("""
                CREATE TABLE slide_data_backup AS
                SELECT id, project_id, slide_index, slide_id, title, content_type,
                       html_content, slide_metadata, created_at, updated_at
                FROM slide_data
            """))

            await session.execute(text("DROP TABLE slide_data"))

            await session.execute(text("""
                CREATE TABLE slide_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_id VARCHAR(36) NOT NULL,
                    slide_index INTEGER NOT NULL,
                    slide_id VARCHAR(100) NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    content_type VARCHAR(50) NOT NULL,
                    html_content TEXT NOT NULL,
                    slide_metadata JSON,
                    created_at FLOAT NOT NULL,
                    updated_at FLOAT NOT NULL,
                    FOREIGN KEY (project_id) REFERENCES projects (project_id)
                )
            """))

            await session.execute(text("""
                INSERT INTO slide_data
                SELECT * FROM slide_data_backup
            """))

            await session.execute(text("DROP TABLE slide_data_backup"))

            await session.commit()
            logger.info("Migration 004 rollback completed")

        except Exception as e:
            await session.rollback()
            logger.error(f"Migration 004 rollback failed: {e}")
            raise

    async def _migration_005_up(self, session: AsyncSession):
        """Migration 005: Add project_metadata column to projects table"""
        try:
            logger.info("Running migration 005: Adding project_metadata column to projects table")

            # Check if project_metadata column already exists
            result = await session.execute(text("""
                PRAGMA table_info(projects)
            """))
            columns = result.fetchall()
            column_names = [col[1] for col in columns]

            if 'project_metadata' not in column_names:
                # Add project_metadata column to projects table
                await session.execute(text("""
                    ALTER TABLE projects
                    ADD COLUMN project_metadata JSON
                """))
                logger.info("Added project_metadata column to projects table")
            else:
                logger.info("project_metadata column already exists in projects table")

            await session.commit()
            logger.info("Migration 005 completed successfully")

        except Exception as e:
            await session.rollback()
            logger.error(f"Migration 005 failed: {e}")
            raise

    async def _migration_005_down(self, session: AsyncSession):
        """Migration 005 rollback: Remove project_metadata column from projects table"""
        try:
            logger.info("Rolling back migration 005: Removing project_metadata column from projects table")

            # SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
            await session.execute(text("""
                CREATE TABLE projects_backup AS
                SELECT id, project_id, title, scenario, topic, requirements, status,
                       outline, slides_html, slides_data, confirmed_requirements,
                       version, created_at, updated_at
                FROM projects
            """))

            await session.execute(text("DROP TABLE projects"))

            await session.execute(text("""
                CREATE TABLE projects (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_id VARCHAR(36) UNIQUE NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    scenario VARCHAR(100) NOT NULL,
                    topic VARCHAR(255) NOT NULL,
                    requirements TEXT,
                    status VARCHAR(50) DEFAULT 'draft',
                    outline JSON,
                    slides_html TEXT,
                    slides_data JSON,
                    confirmed_requirements JSON,
                    version INTEGER DEFAULT 1,
                    created_at FLOAT NOT NULL,
                    updated_at FLOAT NOT NULL
                )
            """))

            await session.execute(text("""
                INSERT INTO projects
                SELECT * FROM projects_backup
            """))

            await session.execute(text("DROP TABLE projects_backup"))

            # Recreate indexes
            await session.execute(text("CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)"))
            await session.execute(text("CREATE INDEX IF NOT EXISTS idx_projects_scenario ON projects(scenario)"))
            await session.execute(text("CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at)"))

            await session.commit()
            logger.info("Migration 005 rollback completed")

        except Exception as e:
            await session.rollback()
            logger.error(f"Migration 005 rollback failed: {e}")
            raise

    async def _migration_006_up(self, session: AsyncSession):
        """Migration 006: Add is_user_edited field to slide_data table"""
        try:
            logger.info("Running migration 006: Adding is_user_edited field to slide_data table")

            # Check if is_user_edited column already exists
            result = await session.execute(text("""
                PRAGMA table_info(slide_data)
            """))
            columns = result.fetchall()
            column_names = [col[1] for col in columns]

            if 'is_user_edited' not in column_names:
                # Add is_user_edited column to slide_data table
                await session.execute(text("""
                    ALTER TABLE slide_data
                    ADD COLUMN is_user_edited BOOLEAN DEFAULT 0 NOT NULL
                """))
                logger.info("Added is_user_edited column to slide_data table")
            else:
                logger.info("is_user_edited column already exists in slide_data table")

            await session.commit()
            logger.info("Migration 006 completed successfully")

        except Exception as e:
            await session.rollback()
            logger.error(f"Migration 006 failed: {e}")
            raise

    async def _migration_006_down(self, session: AsyncSession):
        """Migration 006 rollback: Remove is_user_edited field from slide_data table"""
        try:
            logger.info("Rolling back migration 006: Removing is_user_edited field from slide_data table")

            # SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
            await session.execute(text("""
                CREATE TABLE slide_data_backup AS
                SELECT id, project_id, slide_index, slide_id, title, content_type,
                       html_content, slide_metadata, template_id, created_at, updated_at
                FROM slide_data
            """))

            await session.execute(text("DROP TABLE slide_data"))

            await session.execute(text("""
                CREATE TABLE slide_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_id VARCHAR(36) NOT NULL,
                    slide_index INTEGER NOT NULL,
                    slide_id VARCHAR(100) NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    content_type VARCHAR(50) NOT NULL,
                    html_content TEXT NOT NULL,
                    slide_metadata JSON,
                    template_id INTEGER REFERENCES ppt_templates(id),
                    created_at FLOAT NOT NULL,
                    updated_at FLOAT NOT NULL,
                    FOREIGN KEY (project_id) REFERENCES projects (project_id)
                )
            """))

            await session.execute(text("""
                INSERT INTO slide_data
                SELECT * FROM slide_data_backup
            """))

            await session.execute(text("DROP TABLE slide_data_backup"))

            await session.commit()
            logger.info("Migration 006 rollback completed")

        except Exception as e:
            await session.rollback()
            logger.error(f"Migration 006 rollback failed: {e}")
            raise

    async def _create_migration_table(self, session: AsyncSession):
        """Create migration tracking table"""
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version VARCHAR(10) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            applied_at FLOAT NOT NULL,
            rollback_sql TEXT
        )
        """
        
        await session.execute(text(create_table_sql))
        await session.commit()
    
    async def _get_applied_migrations(self, session: AsyncSession) -> List[str]:
        """Get list of applied migration versions"""
        try:
            result = await session.execute(text("SELECT version FROM schema_migrations ORDER BY version"))
            return [row[0] for row in result.fetchall()]
        except Exception:
            # Table doesn't exist yet
            return []
    
    async def _record_migration(self, session: AsyncSession, migration: Dict[str, Any]):
        """Record a migration as applied"""
        insert_sql = """
        INSERT INTO schema_migrations (version, name, description, applied_at)
        VALUES (:version, :name, :description, :applied_at)
        """
        
        await session.execute(text(insert_sql), {
            "version": migration["version"],
            "name": migration["name"],
            "description": migration["description"],
            "applied_at": time.time()
        })
        await session.commit()
    
    async def _remove_migration_record(self, session: AsyncSession, version: str):
        """Remove migration record"""
        delete_sql = "DELETE FROM schema_migrations WHERE version = :version"
        await session.execute(text(delete_sql), {"version": version})
        await session.commit()
    
    async def migrate_up(self, target_version: str = None) -> bool:
        """Run migrations up to target version"""
        try:
            async with AsyncSessionLocal() as session:
                # Create migration table if it doesn't exist
                await self._create_migration_table(session)
                
                # Get applied migrations
                applied = await self._get_applied_migrations(session)
                
                # Find migrations to apply
                to_apply = []
                for migration in self.migrations:
                    if migration["version"] not in applied:
                        to_apply.append(migration)
                        if target_version and migration["version"] == target_version:
                            break
                
                if not to_apply:
                    logger.info("No migrations to apply")
                    return True
                
                # Apply migrations
                for migration in to_apply:
                    logger.info(f"Applying migration {migration['version']}: {migration['name']}")
                    
                    try:
                        await migration["up"](session)
                        await self._record_migration(session, migration)
                        logger.info(f"Migration {migration['version']} applied successfully")
                    except Exception as e:
                        logger.error(f"Failed to apply migration {migration['version']}: {e}")
                        raise
                
                logger.info("All migrations applied successfully")
                return True
                
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            return False
    
    async def migrate_down(self, target_version: str) -> bool:
        """Rollback migrations down to target version"""
        try:
            async with AsyncSessionLocal() as session:
                # Get applied migrations
                applied = await self._get_applied_migrations(session)
                
                # Find migrations to rollback
                to_rollback = []
                for migration in reversed(self.migrations):
                    if migration["version"] in applied and migration["version"] > target_version:
                        to_rollback.append(migration)
                
                if not to_rollback:
                    logger.info("No migrations to rollback")
                    return True
                
                # Rollback migrations
                for migration in to_rollback:
                    logger.info(f"Rolling back migration {migration['version']}: {migration['name']}")
                    
                    try:
                        await migration["down"](session)
                        await self._remove_migration_record(session, migration["version"])
                        logger.info(f"Migration {migration['version']} rolled back successfully")
                    except Exception as e:
                        logger.error(f"Failed to rollback migration {migration['version']}: {e}")
                        raise
                
                logger.info("Migrations rolled back successfully")
                return True
                
        except Exception as e:
            logger.error(f"Migration rollback failed: {e}")
            return False
    
    async def get_migration_status(self) -> Dict[str, Any]:
        """Get current migration status"""
        try:
            async with AsyncSessionLocal() as session:
                await self._create_migration_table(session)
                applied = await self._get_applied_migrations(session)
                
                status = {
                    "current_version": applied[-1] if applied else None,
                    "applied_migrations": applied,
                    "available_migrations": [m["version"] for m in self.migrations],
                    "pending_migrations": [m["version"] for m in self.migrations if m["version"] not in applied]
                }
                
                return status
                
        except Exception as e:
            logger.error(f"Failed to get migration status: {e}")
            return {"error": str(e)}


# Global migration manager instance
migration_manager = DatabaseMigration()
