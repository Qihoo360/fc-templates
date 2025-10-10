"""035_sys_arg_ddl

Revision ID: 29559ee607af
Revises: e8b470d2b150
Create Date: 2025-08-15 11:43:26.175792

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '29559ee607af'
down_revision = 'e8b470d2b150'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'sys_arg',
        sa.Column('id', sa.BigInteger(), primary_key=True, nullable=False, comment='ID'),
        sa.Column('pkey', sa.String(255), nullable=False, comment='pkey'),
        sa.Column('pval', sa.String(255), nullable=True, comment='pval'),
        sa.Column('ptype', sa.String(255), nullable=False, server_default='str', comment='str or file'),
        sa.Column('sort_no', sa.Integer(), nullable=False, server_default='1', comment='sort_no')
    )
    op.create_index(op.f('ix_sys_arg_id'), 'sys_arg', ['id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_sys_arg_id'), table_name='sys_arg')
    op.drop_table('sys_arg')
