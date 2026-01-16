"""
Project Share Service
Handles generation and validation of public share links for presentations
"""

import secrets
import logging
from typing import Optional
from sqlalchemy.orm import Session
from ..database.models import Project

logger = logging.getLogger(__name__)


class ShareService:
    """Service for managing project sharing functionality"""

    def __init__(self, db: Session):
        self.db = db

    def generate_share_token(self, project_id: str) -> Optional[str]:
        """
        Generate a unique share token for a project, or return existing one

        Args:
            project_id: The project ID to generate a share link for

        Returns:
            The generated share token, or None if project not found
        """
        try:
            # Get the project
            project = self.db.query(Project).filter(
                Project.project_id == project_id
            ).first()

            if not project:
                logger.error(f"Project {project_id} not found")
                return None

            # If project already has a valid share token, return it
            if project.share_token:
                # Enable sharing if it was disabled
                if not project.share_enabled:
                    project.share_enabled = True
                    self.db.commit()
                    logger.info(f"Re-enabled sharing for project {project_id}")
                else:
                    logger.info(f"Returning existing share token for project {project_id}")
                return project.share_token

            # Generate a new secure random token
            share_token = secrets.token_urlsafe(32)

            # Update project with share token and enable sharing
            project.share_token = share_token
            project.share_enabled = True
            self.db.commit()

            logger.info(f"Generated new share token for project {project_id}")
            return share_token

        except Exception as e:
            logger.error(f"Error generating share token: {e}")
            self.db.rollback()
            return None

    def disable_sharing(self, project_id: str) -> bool:
        """
        Disable sharing for a project

        Args:
            project_id: The project ID to disable sharing for

        Returns:
            True if successful, False otherwise
        """
        try:
            project = self.db.query(Project).filter(
                Project.project_id == project_id
            ).first()

            if not project:
                logger.error(f"Project {project_id} not found")
                return False

            project.share_enabled = False
            self.db.commit()

            logger.info(f"Disabled sharing for project {project_id}")
            return True

        except Exception as e:
            logger.error(f"Error disabling sharing: {e}")
            self.db.rollback()
            return False

    def validate_share_token(self, share_token: str) -> Optional[Project]:
        """
        Validate a share token and return the associated project

        Args:
            share_token: The share token to validate

        Returns:
            The Project object if valid, None otherwise
        """
        try:
            project = self.db.query(Project).filter(
                Project.share_token == share_token,
                Project.share_enabled == True
            ).first()

            if not project:
                logger.warning(f"Invalid or disabled share token")
                return None

            return project

        except Exception as e:
            logger.error(f"Error validating share token: {e}")
            return None

    def get_share_info(self, project_id: str) -> dict:
        """
        Get sharing information for a project

        Args:
            project_id: The project ID

        Returns:
            Dictionary with share information
        """
        try:
            project = self.db.query(Project).filter(
                Project.project_id == project_id
            ).first()

            if not project:
                return {
                    "enabled": False,
                    "share_token": None,
                    "share_url": None
                }

            return {
                "enabled": project.share_enabled,
                "share_token": project.share_token,
                "share_url": f"/share/{project.share_token}" if project.share_token else None
            }

        except Exception as e:
            logger.error(f"Error getting share info: {e}")
            return {
                "enabled": False,
                "share_token": None,
                "share_url": None
            }
