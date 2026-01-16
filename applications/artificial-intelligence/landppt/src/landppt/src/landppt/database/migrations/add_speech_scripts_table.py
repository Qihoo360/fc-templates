"""
Add speech_scripts table migration
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../..'))

from sqlalchemy import text
from landppt.database.database import engine


def upgrade():
    """Create speech_scripts table"""
    with engine.connect() as conn:
        # Create speech_scripts table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS speech_scripts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id VARCHAR(36) NOT NULL,
                slide_index INTEGER NOT NULL,
                slide_title VARCHAR(255) NOT NULL,
                script_content TEXT NOT NULL,
                estimated_duration VARCHAR(50),
                speaker_notes TEXT,
                generation_type VARCHAR(20) NOT NULL,
                tone VARCHAR(50) NOT NULL,
                target_audience VARCHAR(100) NOT NULL,
                custom_audience TEXT,
                language_complexity VARCHAR(20) NOT NULL,
                speaking_pace VARCHAR(20) NOT NULL,
                custom_style_prompt TEXT,
                include_transitions BOOLEAN NOT NULL DEFAULT 1,
                include_timing_notes BOOLEAN NOT NULL DEFAULT 0,
                created_at REAL NOT NULL,
                updated_at REAL NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects (project_id)
            )
        """))
        
        # Create indexes
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_speech_scripts_project_id 
            ON speech_scripts (project_id)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_speech_scripts_project_slide 
            ON speech_scripts (project_id, slide_index)
        """))
        
        conn.commit()


def downgrade():
    """Drop speech_scripts table"""
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS speech_scripts"))
        conn.commit()


if __name__ == "__main__":
    upgrade()
    print("Speech scripts table created successfully!")
