"""011_license_ddl

Revision ID: a3af70d43e98
Revises: 8dc3b1bdbfef
Create Date: 2025-06-18 16:09:33.896600

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a3af70d43e98'
down_revision = '941e2355a94d'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'license',
        sa.Column('id', sa.BigInteger(), primary_key=True, nullable=False),
        sa.Column('license_key', sa.Text(), default="", nullable=False),
        sa.Column('f2c_license', sa.Text(), default="", nullable=False),
        sa.Column('create_time', sa.BigInteger(), default=0, nullable=False),
        sa.Column('update_time', sa.BigInteger(), default=0, nullable=False)
    )
    op.create_index(op.f('ix_license_id'), 'license', ['id'], unique=False)


def downgrade():
    op.drop_table('license')
    op.drop_index(op.f('ix_license_id'), table_name='license')
