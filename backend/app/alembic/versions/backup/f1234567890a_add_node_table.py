"""Add Node table

Revision ID: f1234567890a
Revises: 1a31ce608336
Create Date: 2025-11-10 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'f1234567890a'
down_revision = '1a31ce608336'
branch_labels = None
depends_on = None


def upgrade():
    # Create Node table
    op.create_table(
        'node',
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('ip', sa.String(length=64), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('tags', sa.String(length=255), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=True),
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_node_name'), 'node', ['name'], unique=False)


def downgrade():
    # Drop Node table
    op.drop_index(op.f('ix_node_name'), table_name='node')
    op.drop_table('node')
