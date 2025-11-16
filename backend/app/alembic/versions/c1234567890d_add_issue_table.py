"""Add issue table

Revision ID: c1234567890d
Revises: b1234567890c
Create Date: 2025-11-16 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'c1234567890d'
down_revision = 'b1234567890c'
branch_labels = None
depends_on = None


def upgrade():
    # 创建issue表
    op.create_table(
        'issue',
        sa.Column('title', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(length=2048), nullable=True),
        sa.Column('repository_url', sqlmodel.sql.sqltypes.AutoString(length=512), nullable=True),
        sa.Column('issue_number', sa.Integer(), nullable=True),
        sa.Column('status', sqlmodel.sql.sqltypes.AutoString(length=32), nullable=False),
        sa.Column('priority', sa.Integer(), nullable=False),
        sa.Column('assigned_node_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('error_message', sqlmodel.sql.sqltypes.AutoString(length=1024), nullable=True),
        sa.Column('result_branch', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('issue')
