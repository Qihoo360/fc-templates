"""020_workspace_ddl

Revision ID: a6b44114c17f
Revises: dcaecd481715
Create Date: 2025-07-06 18:03:36.143060

"""
from alembic import op
import sqlalchemy as sa
from sqlmodel import BigInteger, String, column, table


# revision identifiers, used by Alembic.
revision = 'a6b44114c17f'
down_revision = 'dcaecd481715'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'sys_workspace',
        sa.Column('id', sa.BigInteger(), primary_key=True, nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('create_time', sa.BigInteger(), default=0, nullable=False)
    )
    op.create_index(op.f('ix_sys_workspace_id'), 'sys_workspace', ['id'], unique=False)
    
    accounts_table = table(
        "sys_workspace",
        column("id", BigInteger),
        column("name", String),
        column("create_time", BigInteger),
    )

    op.bulk_insert(
        accounts_table,
        [
            {
                "id": 1,
                "name": "i18n_default_workspace",
                "create_time": 1672531199000
            }
        ]
    )

def downgrade():
    op.drop_index(op.f('ix_sys_workspace_id'), table_name='sys_workspace')
    op.drop_table('sys_workspace')
    
