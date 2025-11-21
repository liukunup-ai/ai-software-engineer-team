"""Update credential schema for categories, PAT, and node links

Revision ID: g1234567890e
Revises: e3c92c171920
Create Date: 2025-11-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = 'g1234567890e'
down_revision = 'e3c92c171920'
branch_labels = None
depends_on = None


credential_category_enum = sa.Enum(
    'github-copilot', 'cursor', 'cluade-code', name='credentialcategory'
)


def upgrade():
    bind = op.get_bind()
    credential_category_enum.create(bind, checkfirst=True)

    op.add_column(
        'credential',
        sa.Column(
            'category', credential_category_enum, nullable=False, server_default='github-copilot'
        ),
    )
    op.add_column(
        'credential', sa.Column('pat', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False, server_default='')
    )
    op.add_column(
        'credential', sa.Column('is_disabled', sa.Boolean(), nullable=False, server_default='false')
    )

    op.create_table(
        'credential_node_link',
        sa.Column('credential_id', sa.Uuid(), nullable=False),
        sa.Column('node_id', sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(['credential_id'], ['credential.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['node_id'], ['node.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('credential_id', 'node_id'),
    )

    op.drop_column('credential', 'description')
    op.drop_column('credential', 'service')
    op.drop_column('credential', 'password')
    op.drop_column('credential', 'username')

    op.alter_column('credential', 'category', server_default=None)
    op.alter_column('credential', 'pat', server_default=None)
    op.alter_column('credential', 'is_disabled', server_default=None)


def downgrade():
    op.drop_table('credential_node_link')

    op.add_column(
        'credential',
        sa.Column('username', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False, server_default=''),
    )
    op.add_column(
        'credential',
        sa.Column('password', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False, server_default=''),
    )
    op.add_column(
        'credential',
        sa.Column('service', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False, server_default=''),
    )
    op.add_column(
        'credential',
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
    )

    op.alter_column('credential', 'username', server_default=None)
    op.alter_column('credential', 'password', server_default=None)
    op.alter_column('credential', 'service', server_default=None)

    op.drop_column('credential', 'is_disabled')
    op.drop_column('credential', 'pat')
    op.drop_column('credential', 'category')

    bind = op.get_bind()
    credential_category_enum.drop(bind, checkfirst=True)