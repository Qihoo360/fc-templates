"""036_modify_assistant

Revision ID: 646e7ca28e0e
Revises: 29559ee607af
Create Date: 2025-08-18 16:12:46.041413

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '646e7ca28e0e'
down_revision = '29559ee607af'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('sys_assistant', sa.Column('app_id', sa.String(255), nullable=True, comment='app_id'))
    op.add_column('sys_assistant', sa.Column('app_secret', sa.String(255), nullable=True, comment='app_secret'))


def downgrade():
    op.drop_column('sys_assistant', 'app_id')
    op.drop_column('sys_assistant', 'app_secret')
