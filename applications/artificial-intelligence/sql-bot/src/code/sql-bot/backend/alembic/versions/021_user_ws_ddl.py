"""021_user_ws_ddl

Revision ID: 440e9e41da3c
Revises: a6b44114c17f
Create Date: 2025-07-07 17:21:46.858887

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '440e9e41da3c'
down_revision = 'a6b44114c17f'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'sys_user_ws',
        sa.Column('id', sa.BigInteger(), primary_key=True, nullable=False),
        sa.Column('uid', sa.BigInteger(), nullable=False),
        sa.Column('oid', sa.BigInteger(), nullable=False),
        sa.Column('weight', sa.Integer(), nullable=False)
    )
    op.create_index(op.f('ix_sys_user_ws_id'), 'sys_user_ws', ['id'], unique=False)


def downgrade():
    #op.drop_index(op.f('ix_sys_user_ws_id'), table_name='sys_user_ws')
    op.drop_table('sys_user_ws')
