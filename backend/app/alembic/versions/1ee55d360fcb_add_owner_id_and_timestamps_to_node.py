"""add_owner_id_and_timestamps_to_node

Revision ID: 1ee55d360fcb
Revises: g1234567890e
Create Date: 2025-11-21 14:52:32.603619

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '1ee55d360fcb'
down_revision = 'g1234567890e'
branch_labels = None
depends_on = None


def upgrade():
    # Add owner_id column with foreign key constraint
    op.add_column('node', sa.Column('owner_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key('fk_node_owner_id_user', 'node', 'user', ['owner_id'], ['id'], ondelete='CASCADE')
    
    # Add timestamp columns
    op.add_column('node', sa.Column('created_at', sa.DateTime(), nullable=True))
    op.add_column('node', sa.Column('updated_at', sa.DateTime(), nullable=True))
    
    # Update existing rows to set default timestamps
    op.execute("UPDATE node SET created_at = NOW(), updated_at = NOW() WHERE created_at IS NULL")
    
    # Make columns non-nullable after setting default values
    op.alter_column('node', 'created_at', nullable=False)
    op.alter_column('node', 'updated_at', nullable=False)


def downgrade():
    # Drop the columns in reverse order
    op.drop_column('node', 'updated_at')
    op.drop_column('node', 'created_at')
    op.drop_constraint('fk_node_owner_id_user', 'node', type_='foreignkey')
    op.drop_column('node', 'owner_id')
