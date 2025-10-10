"""017_rsa_ddl

Revision ID: a0ba8268868d
Revises: 031148da1d81
Create Date: 2025-06-27 15:05:38.676825

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = 'a0ba8268868d'
down_revision = '031148da1d81'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'rsa',
        sa.Column('id', sa.BigInteger(), primary_key=True, nullable=False),
        sa.Column('private_key', sa.Text(), default="", nullable=False),
        sa.Column('public_key', sa.Text(), default="", nullable=False),
        sa.Column('salt', sa.Text(), default="", nullable=False),
        sa.Column('create_time', sa.BigInteger(), default=0, nullable=False),
        sa.Column('update_time', sa.BigInteger(), default=0, nullable=False)
    )
    op.create_index(op.f('ix_rsa_id'), 'rsa', ['id'], unique=False)


def downgrade():
    op.drop_table('rsa')
    op.drop_index(op.f('ix_rsa_id'), table_name='rsa')
