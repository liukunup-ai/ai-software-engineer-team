"""Initial schema - all models

Revision ID: 001_initial_schema
Revises: 
Create Date: 2025-11-21 16:00:00.000000

本迁移文件整合了所有数据模型的完整schema定义，按照models目录结构组织：
- User (用户表)
- Project (项目表)
- Repository (仓库表) 
- Issue (问题表)
- Node (节点表)
- Credential (凭证表)
- Prompt (提示词表)
- NodeRegistrationKey (节点注册密钥表)
- WorkflowLog (工作流日志表)
- CredentialNodeLink (凭证-节点关联表)
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


def upgrade():
    """创建所有表结构"""
    
    # ==================== User Table ====================
    # 用户表 - 系统核心表，存储用户基本信息和认证数据
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
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_email'), 'user', ['email'], unique=True)

    # ==================== Project Table ====================
    # 项目表 - 存储用户创建的项目信息
    op.create_table(
        'project',
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('owner_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # ==================== Repository Table ====================
    # 仓库表 - 存储代码仓库信息
    op.create_table(
        'repository',
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column('url', sqlmodel.sql.sqltypes.AutoString(length=1023), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=False),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('owner_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # ==================== Issue Table ====================
    # 问题表 - 存储GitHub Issue或任务信息
    op.create_table(
        'issue',
        sa.Column('title', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(length=2048), nullable=True),
        sa.Column('repository_url', sqlmodel.sql.sqltypes.AutoString(length=512), nullable=True),
        sa.Column('issue_number', sa.Integer(), nullable=True),
        sa.Column('status', sqlmodel.sql.sqltypes.AutoString(length=32), nullable=False),
        sa.Column('priority', sa.Integer(), nullable=False),
        sa.Column('assigned_node_id', sa.Uuid(), nullable=True),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('owner_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('error_message', sqlmodel.sql.sqltypes.AutoString(length=1024), nullable=True),
        sa.Column('result_branch', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # ==================== Node Table ====================
    # 节点表 - 存储工作节点信息
    op.create_table(
        'node',
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column('ip', sqlmodel.sql.sqltypes.AutoString(length=64), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
        sa.Column('tags', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
        sa.Column('status', sqlmodel.sql.sqltypes.AutoString(length=32), nullable=True),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('owner_id', sa.Uuid(), nullable=False),
        sa.Column('last_heartbeat', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_node_name'), 'node', ['name'], unique=False)

    # ==================== Credential Table ====================
    # 凭证表 - 存储各种服务的认证凭证（GitHub Copilot, Cursor, Claude等）
    credential_category_enum = postgresql.ENUM(
        'github-copilot', 
        'cursor', 
        'cluade-code',
        name='credentialcategory',
        create_type=True
    )
    credential_category_enum.create(op.get_bind(), checkfirst=True)
    
    op.create_table(
        'credential',
        sa.Column('title', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column('category', credential_category_enum, nullable=False),
        sa.Column('pat', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column('is_disabled', sa.Boolean(), nullable=False),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('owner_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # ==================== Prompt Table ====================
    # 提示词表 - 存储AI提示词模板
    op.create_table(
        'prompt',
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column('content', sqlmodel.sql.sqltypes.AutoString(length=5000), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.Column('tags', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('owner_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # ==================== NodeRegistrationKey Table ====================
    # 节点注册密钥表 - 存储节点注册所需的密钥（单行表）
    op.create_table(
        'node_registration_key',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('key', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_node_registration_key_key'), 'node_registration_key', ['key'], unique=False)

    # ==================== WorkflowLog Table ====================
    # 工作流日志表 - 记录Issue处理过程中的各个步骤
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
        sa.ForeignKeyConstraint(['issue_id'], ['issue.id'], ),
        sa.ForeignKeyConstraint(['node_id'], ['node.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # ==================== CredentialNodeLink Table ====================
    # 凭证-节点关联表 - 多对多关系，关联凭证和节点
    op.create_table(
        'credentialnodelink',
        sa.Column('credential_id', sa.Uuid(), nullable=False),
        sa.Column('node_id', sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(['credential_id'], ['credential.id'], ),
        sa.ForeignKeyConstraint(['node_id'], ['node.id'], ),
        sa.PrimaryKeyConstraint('credential_id', 'node_id')
    )


def downgrade():
    """删除所有表结构"""
    # 按照依赖关系的相反顺序删除表
    op.drop_table('credentialnodelink')
    op.drop_table('workflowlog')
    op.drop_index(op.f('ix_node_registration_key_key'), table_name='node_registration_key')
    op.drop_table('node_registration_key')
    op.drop_table('prompt')
    op.drop_table('credential')
    op.drop_index(op.f('ix_node_name'), table_name='node')
    op.drop_table('node')
    op.drop_table('issue')
    op.drop_table('repository')
    op.drop_table('project')
    op.drop_index(op.f('ix_user_email'), table_name='user')
    op.drop_table('user')
    
    # 删除枚举类型
    credential_category_enum = postgresql.ENUM(
        'github-copilot', 
        'cursor', 
        'cluade-code',
        name='credentialcategory'
    )
    credential_category_enum.drop(op.get_bind(), checkfirst=True)
