"""add_workflow_log_table

Revision ID: 19be435a02b1
Revises: 2b2a406df71b
Create Date: 2025-11-21 14:58:47.196251

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '19be435a02b1'
down_revision = '2b2a406df71b'
branch_labels = None
depends_on = None


def upgrade():
    # Create workflow_log table
    op.create_table(
        'workflow_log',
        sa.Column('issue_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('node_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('step_name', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False),
        sa.Column('status', sqlmodel.sql.sqltypes.AutoString(length=32), nullable=False),
        sa.Column('command', sqlmodel.sql.sqltypes.AutoString(length=512), nullable=True),
        sa.Column('output', sqlmodel.sql.sqltypes.AutoString(length=4096), nullable=True),
        sa.Column('error_message', sqlmodel.sql.sqltypes.AutoString(length=2048), nullable=True),
        sa.Column('duration_ms', sa.Integer(), nullable=True),
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['issue_id'], ['issue.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['node_id'], ['node.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    # Drop workflow_log table
    op.drop_table('workflow_log')
