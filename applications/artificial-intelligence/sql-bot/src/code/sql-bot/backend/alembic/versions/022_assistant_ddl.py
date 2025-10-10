"""022_assistant_ddl

Revision ID: e6b20ae73606
Revises: 440e9e41da3c
Create Date: 2025-07-09 18:20:27.160183

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = 'e6b20ae73606'
down_revision = '440e9e41da3c'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'sys_assistant',
        sa.Column('id', sa.BigInteger(), primary_key=True, nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('domain', sa.String(255), nullable=False),
        sa.Column('type', sa.Integer(), nullable=False, default=0),
        sa.Column('configuration', sa.Text(), nullable=True),
        sa.Column('create_time', sa.BigInteger(), default=0, nullable=False)
    )
    op.create_index(op.f('ix_sys_assistant_id'), 'sys_assistant', ['id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_sys_assistant_id'), table_name='sys_assistant')
    op.drop_table('sys_assistant')
