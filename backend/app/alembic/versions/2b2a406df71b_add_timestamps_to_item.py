"""add_timestamps_to_item

Revision ID: 2b2a406df71b
Revises: 0a0ed29996b1
Create Date: 2025-11-21 14:56:33.498283

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '2b2a406df71b'
down_revision = '0a0ed29996b1'
branch_labels = None
depends_on = None


def upgrade():
    # Add timestamp columns
    op.add_column('item', sa.Column('created_at', sa.DateTime(), nullable=True))
    op.add_column('item', sa.Column('updated_at', sa.DateTime(), nullable=True))
    
    # Update existing rows to set default timestamps
    op.execute("UPDATE item SET created_at = NOW(), updated_at = NOW() WHERE created_at IS NULL")
    
    # Make columns non-nullable after setting default values
    op.alter_column('item', 'created_at', nullable=False)
    op.alter_column('item', 'updated_at', nullable=False)


def downgrade():
    # Drop the timestamp columns
    op.drop_column('item', 'updated_at')
    op.drop_column('item', 'created_at')
