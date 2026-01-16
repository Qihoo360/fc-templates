"""
Add share_token and share_enabled fields to projects table
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../..'))

from sqlalchemy import text
from landppt.database.database import engine


def upgrade():
    """Add share_token and share_enabled columns to projects table"""
    with engine.connect() as conn:
        # Check if columns exist before adding them
        try:
            # Add share_token column (without UNIQUE constraint in ALTER TABLE for SQLite)
            conn.execute(text("""
                ALTER TABLE projects
                ADD COLUMN share_token VARCHAR(64)
            """))
            print("Added share_token column")
        except Exception as e:
            print(f"share_token column may already exist: {e}")

        try:
            # Add share_enabled column
            conn.execute(text("""
                ALTER TABLE projects
                ADD COLUMN share_enabled BOOLEAN NOT NULL DEFAULT 0
            """))
            print("Added share_enabled column")
        except Exception as e:
            print(f"share_enabled column may already exist: {e}")

        try:
            # Create unique index on share_token for faster lookups and uniqueness
            conn.execute(text("""
                CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_share_token
                ON projects (share_token)
                WHERE share_token IS NOT NULL
            """))
            print("Created unique index on share_token")
        except Exception as e:
            print(f"Index creation error: {e}")

        conn.commit()
        print("Migration completed successfully!")


def downgrade():
    """Remove share_token and share_enabled columns from projects table"""
    with engine.connect() as conn:
        try:
            # Drop index
            conn.execute(text("DROP INDEX IF EXISTS idx_projects_share_token"))

            # SQLite doesn't support DROP COLUMN in older versions
            # We'll need to recreate the table without these columns
            # For now, just set them to NULL
            print("Note: SQLite doesn't support DROP COLUMN. Columns will remain but can be ignored.")
        except Exception as e:
            print(f"Error during downgrade: {e}")

        conn.commit()


if __name__ == "__main__":
    upgrade()
    print("Project share fields migration completed!")
