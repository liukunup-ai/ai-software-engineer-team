"""make_node_owner_id_non_nullable

Revision ID: 26c2c831dc19
Revises: 1ee55d360fcb
Create Date: 2025-11-21 14:53:18.421003

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '26c2c831dc19'
down_revision = '1ee55d360fcb'
branch_labels = None
depends_on = None


def upgrade():
    # Make owner_id column non-nullable
    op.alter_column('node', 'owner_id', nullable=False)


def downgrade():
    # Make owner_id column nullable again
    op.alter_column('node', 'owner_id', nullable=True)
