"""032_modify_assistant_ddl

Revision ID: 6549e47f9adc
Revises: bd2ed188b5bd
Create Date: 2025-07-22 12:23:16.646665

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '6549e47f9adc'
down_revision = 'bd2ed188b5bd'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('sys_assistant', sa.Column('description', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('sys_assistant', 'description')
