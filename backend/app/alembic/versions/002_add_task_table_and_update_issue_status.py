"""add task table and update issue status

Revision ID: 002_add_task_table
Revises: 318e2657ad46
Create Date: 2025-11-21 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from datetime import datetime


# revision identifiers, used by Alembic.
revision = '002_add_task_table'
down_revision = '318e2657ad46'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Create task table
    op.create_table('task',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('issue_id', sa.Uuid(), nullable=False),
        sa.Column('node_id', sa.Uuid(), nullable=True),
        sa.Column('status', sqlmodel.sql.sqltypes.AutoString(length=32), nullable=False),
        sa.Column('command', sqlmodel.sql.sqltypes.AutoString(length=512), nullable=True),
        sa.Column('result_branch', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
        sa.Column('error_message', sqlmodel.sql.sqltypes.AutoString(length=2048), nullable=True),
        sa.Column('owner_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['issue_id'], ['issue.id'], ),
        sa.ForeignKeyConstraint(['node_id'], ['node.id'], ),
        sa.ForeignKeyConstraint(['owner_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # 2. Update issue status values
    # Note: This is a data migration, updating existing status values
    # pending -> pending (待处理)
    # processing -> processing (处理中)
    # completed -> pending_merge (待合入)
    # failed -> terminated (终止)
    
    # Update completed to pending_merge
    op.execute("UPDATE issue SET status = 'pending_merge' WHERE status = 'completed'")
    
    # Update failed to terminated
    op.execute("UPDATE issue SET status = 'terminated' WHERE status = 'failed'")


def downgrade():
    # Revert issue status changes
    op.execute("UPDATE issue SET status = 'completed' WHERE status = 'pending_merge'")
    op.execute("UPDATE issue SET status = 'failed' WHERE status = 'terminated'")
    
    # Drop task table
    op.drop_table('task')
