"""040_modify_ai_model

Revision ID: 0fc14c2cfe41
Revises: 25cbc85766fd
Create Date: 2025-08-26 23:30:50.192799

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '0fc14c2cfe41'
down_revision = '25cbc85766fd'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column(
        'ai_model',
        'api_key',
        type_=sa.Text(),
        existing_type=sa.String(length=255),
        existing_nullable=True
    )
    op.alter_column(
        'ai_model',
        'api_domain',
        type_=sa.Text(),
        existing_type=sa.String(length=255),
        existing_nullable=False
    )


def downgrade():
    op.alter_column(
        'ai_model',
        'api_key',
        type_=sa.String(),
        existing_type=sa.Text(),
        existing_nullable=True
    )
    op.alter_column(
        'ai_model',
        'api_domain',
        type_=sa.String(),
        existing_type=sa.Text(),
        existing_nullable=False
    )
