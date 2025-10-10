"""001_ddl

Revision ID: 5348b743b05f
Revises: 
Create Date: 2025-04-25 16:26:19.135926

"""


# revision identifiers, used by Alembic.
revision = '5348b743b05f'
down_revision = None
branch_labels = None
depends_on = None


from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from sqlalchemy.sql import table, column
from sqlalchemy import String, Integer, BigInteger
def upgrade():
    op.create_table(
        'sys_user',
        sa.Column('id', sa.BIGINT, primary_key=True),
        sa.Column('account', sa.String(255), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('password', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255)),
        sa.Column('oid', sa.BIGINT, nullable=False),
        sa.Column('status', sa.Integer, nullable=False),
        sa.Column('create_time', sa.BIGINT, nullable=False),
    )
    
    accounts_table = table(
        "sys_user",
        column("id", BigInteger),
        column("account", String),
        column("name", String),
        column("password", String),
        column("email", String),
        column("oid", BigInteger),
        column("status", Integer),
        column("create_time", BigInteger),
    )

    op.bulk_insert(
        accounts_table,
        [
            {
                "id": 1,
                "account": "admin",
                "name": "Administrator",
                "password": "8f32d1e371702c1b1b7346f4b07a701d",
                "email": "fit2cloud.com",
                "oid": 1,
                "status": 1,
                "create_time": 1672531199000
            }
        ]
    )

def downgrade():
    op.drop_table('sys_user')
