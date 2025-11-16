"""Add NodeRegistrationKey table

Revision ID: b1234567890c
Revises: a1234567890b
Create Date: 2025-11-16 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'b1234567890c'
down_revision = 'a1234567890b'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'noderegistrationkey',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('key', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_node_registration_key_key', 'node_registration_key', ['key'], unique=False)
    # 预先插入一行可选在应用启动初始化时完成，这里保持结构迁移不插入数据


def downgrade():
    op.drop_index('ix_node_registration_key_key', table_name='node_registration_key')
    op.drop_table('node_registration_key')
