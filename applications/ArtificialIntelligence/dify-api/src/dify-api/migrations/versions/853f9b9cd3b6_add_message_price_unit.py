"""add message price unit

Revision ID: 853f9b9cd3b6
Revises: e8883b0148c9
Create Date: 2023-08-19 17:01:57.471562

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = '853f9b9cd3b6'
down_revision = 'e8883b0148c9'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###

    with op.batch_alter_table('message_agent_thoughts', schema=None) as batch_op:
        batch_op.add_column(sa.Column('message_price_unit', sa.Numeric(precision=10, scale=7), server_default=sa.text('0.001'), nullable=False))
        batch_op.add_column(sa.Column('answer_price_unit', sa.Numeric(precision=10, scale=7), server_default=sa.text('0.001'), nullable=False))

    with op.batch_alter_table('messages', schema=None) as batch_op:
        batch_op.add_column(sa.Column('message_price_unit', sa.Numeric(precision=10, scale=7), server_default=sa.text('0.001'), nullable=False))
        batch_op.add_column(sa.Column('answer_price_unit', sa.Numeric(precision=10, scale=7), server_default=sa.text('0.001'), nullable=False))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('messages', schema=None) as batch_op:
        batch_op.drop_column('answer_price_unit')
        batch_op.drop_column('message_price_unit')

    with op.batch_alter_table('message_agent_thoughts', schema=None) as batch_op:
        batch_op.drop_column('answer_price_unit')
        batch_op.drop_column('message_price_unit')

    # ### end Alembic commands ###
