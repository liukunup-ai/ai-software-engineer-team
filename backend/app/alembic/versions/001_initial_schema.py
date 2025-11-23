"""Consolidated initial schema covering all current models.

Revision ID: 001_initial_schema
Revises:
Create Date: 2025-11-23 12:30:00.000000
"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def _enum_exists(enum_name: str) -> bool:
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT EXISTS ("
            "SELECT 1 FROM pg_type WHERE typname = :enum_name"
            ")"
        ),
        {"enum_name": enum_name},
    )
    return bool(result.scalar())


def upgrade():
    credential_category_enum = postgresql.ENUM(
        'github-copilot',
        'cursor',
        'cluade-code',
        'alibaba-qoder',
        name='credentialcategory',
        create_type=False,
    )
    credential_category_enum_creator = postgresql.ENUM(
        'github-copilot',
        'cursor',
        'cluade-code',
        'alibaba-qoder',
        name='credentialcategory',
    )

    if not _enum_exists('credentialcategory'):
        credential_category_enum_creator.create(op.get_bind(), checkfirst=False)

    op.create_table(
        'user',
        sa.Column('email', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_superuser', sa.Boolean(), nullable=False),
        sa.Column('full_name', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('hashed_password', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_user_email', 'user', ['email'], unique=True)
    op.create_index('ix_user_deleted_at', 'user', ['deleted_at'], unique=False)

    op.create_table(
        'project',
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(length=999), nullable=True),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('owner_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_project_deleted_at', 'project', ['deleted_at'], unique=False)

    op.create_table(
        'repository',
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column('url', sqlmodel.sql.sqltypes.AutoString(length=1023), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('owner_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_repository_deleted_at', 'repository', ['deleted_at'], unique=False)

    op.create_table(
        'node',
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column('ip', sqlmodel.sql.sqltypes.AutoString(length=64), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
        sa.Column('tags', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
        sa.Column('status', sqlmodel.sql.sqltypes.AutoString(length=32), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=False),
        sa.Column('is_disabled', sa.Boolean(), nullable=False),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('owner_id', sa.Uuid(), nullable=False),
        sa.Column('last_heartbeat', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_node_name', 'node', ['name'], unique=False)
    op.create_index('ix_node_deleted_at', 'node', ['deleted_at'], unique=False)

    op.create_table(
        'credential',
        sa.Column('title', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column('category', credential_category_enum, nullable=False),
        sa.Column('secret', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column('is_disabled', sa.Boolean(), nullable=False),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('owner_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_credential_deleted_at', 'credential', ['deleted_at'], unique=False)

    op.create_table(
        'prompt',
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column('content', sqlmodel.sql.sqltypes.AutoString(length=9999), nullable=False),
        sa.Column('tags', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('owner_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_prompt_deleted_at', 'prompt', ['deleted_at'], unique=False)

    op.create_table(
        'issue',
        sa.Column('title', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column('content', sqlmodel.sql.sqltypes.AutoString(length=2048), nullable=True),
        sa.Column('repository_url', sqlmodel.sql.sqltypes.AutoString(length=512), nullable=True),
        sa.Column('issue_number', sa.Integer(), nullable=True),
        sa.Column('status', sqlmodel.sql.sqltypes.AutoString(length=32), nullable=False),
        sa.Column('priority', sa.Integer(), nullable=False),
        sa.Column('assigned_node_id', sa.Uuid(), nullable=True),
        sa.Column('project_id', sa.Uuid(), nullable=True),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('owner_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('error_message', sqlmodel.sql.sqltypes.AutoString(length=1024), nullable=True),
        sa.Column('result_branch', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['assigned_node_id'], ['node.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['owner_id'], ['user.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['project_id'], ['project.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_issue_deleted_at', 'issue', ['deleted_at'], unique=False)

    op.create_table(
        'workflowlog',
        sa.Column('issue_id', sa.Uuid(), nullable=False),
        sa.Column('node_id', sa.Uuid(), nullable=True),
        sa.Column('step_name', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False),
        sa.Column('status', sqlmodel.sql.sqltypes.AutoString(length=32), nullable=False),
        sa.Column('command', sqlmodel.sql.sqltypes.AutoString(length=512), nullable=True),
        sa.Column('output', sqlmodel.sql.sqltypes.AutoString(length=4096), nullable=True),
        sa.Column('error_message', sqlmodel.sql.sqltypes.AutoString(length=2048), nullable=True),
        sa.Column('duration_ms', sa.Integer(), nullable=True),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['issue_id'], ['issue.id']),
        sa.ForeignKeyConstraint(['node_id'], ['node.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'task',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('issue_id', sa.Uuid(), nullable=False),
        sa.Column('node_id', sa.Uuid(), nullable=True),
        sa.Column('status', sqlmodel.sql.sqltypes.AutoString(length=32), nullable=False),
        sa.Column('command', sqlmodel.sql.sqltypes.AutoString(length=512), nullable=True),
        sa.Column('args', sqlmodel.sql.sqltypes.AutoString(length=1024), nullable=True),
        sa.Column('result', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
        sa.Column('branch_prefix', sqlmodel.sql.sqltypes.AutoString(length=64), nullable=True),
        sa.Column('owner_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['issue_id'], ['issue.id']),
        sa.ForeignKeyConstraint(['node_id'], ['node.id']),
        sa.ForeignKeyConstraint(['owner_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_task_deleted_at', 'task', ['deleted_at'], unique=False)

    op.create_table(
        'registerkey',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('key', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_registerkey_key', 'registerkey', ['key'], unique=False)
    op.create_index('ix_registerkey_deleted_at', 'registerkey', ['deleted_at'], unique=False)

    op.create_table(
        'credentialnodelink',
        sa.Column('credential_id', sa.Uuid(), nullable=False),
        sa.Column('node_id', sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(['credential_id'], ['credential.id']),
        sa.ForeignKeyConstraint(['node_id'], ['node.id']),
        sa.PrimaryKeyConstraint('credential_id', 'node_id'),
    )

    op.create_table(
        'issue_dependency_link',
        sa.Column('issue_id', sa.Uuid(), nullable=False),
        sa.Column('depends_on_issue_id', sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(['issue_id'], ['issue.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['depends_on_issue_id'], ['issue.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('issue_id', 'depends_on_issue_id'),
    )

    op.create_table(
        'projectmemberlink',
        sa.Column('project_id', sa.Uuid(), nullable=False),
        sa.Column('member_id', sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['project.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['member_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('project_id', 'member_id'),
    )

    op.create_table(
        'projectrepositorylink',
        sa.Column('project_id', sa.Uuid(), nullable=False),
        sa.Column('repository_id', sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['project.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['repository_id'], ['repository.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('project_id', 'repository_id'),
    )

    op.create_table(
        'projectissuelink',
        sa.Column('project_id', sa.Uuid(), nullable=False),
        sa.Column('issue_id', sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['project.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['issue_id'], ['issue.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('project_id', 'issue_id'),
    )

    op.create_table(
        'projectnodelink',
        sa.Column('project_id', sa.Uuid(), nullable=False),
        sa.Column('node_id', sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['project.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['node_id'], ['node.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('project_id', 'node_id'),
    )


def downgrade():
    op.drop_table('projectnodelink')
    op.drop_table('projectissuelink')
    op.drop_table('projectrepositorylink')
    op.drop_table('projectmemberlink')
    op.drop_table('issue_dependency_link')
    op.drop_table('credentialnodelink')

    op.drop_index('ix_registerkey_deleted_at', table_name='registerkey')
    op.drop_index('ix_registerkey_key', table_name='registerkey')
    op.drop_table('registerkey')

    op.drop_index('ix_task_deleted_at', table_name='task')
    op.drop_table('task')

    op.drop_table('workflowlog')

    op.drop_index('ix_issue_deleted_at', table_name='issue')
    op.drop_table('issue')

    op.drop_index('ix_prompt_deleted_at', table_name='prompt')
    op.drop_table('prompt')

    op.drop_index('ix_credential_deleted_at', table_name='credential')
    op.drop_table('credential')

    op.drop_index('ix_node_deleted_at', table_name='node')
    op.drop_index('ix_node_name', table_name='node')
    op.drop_table('node')

    op.drop_index('ix_repository_deleted_at', table_name='repository')
    op.drop_table('repository')

    op.drop_index('ix_project_deleted_at', table_name='project')
    op.drop_table('project')

    op.drop_index('ix_user_deleted_at', table_name='user')
    op.drop_index('ix_user_email', table_name='user')
    op.drop_table('user')

    credential_category_enum = postgresql.ENUM(
        'github-copilot',
        'cursor',
        'cluade-code',
        'alibaba-qoder',
        name='credentialcategory',
        create_type=False,
    )
    credential_category_enum_creator = postgresql.ENUM(
        'github-copilot',
        'cursor',
        'cluade-code',
        'alibaba-qoder',
        name='credentialcategory',
    )
    if _enum_exists('credentialcategory'):
        credential_category_enum_creator.drop(op.get_bind(), checkfirst=False)
