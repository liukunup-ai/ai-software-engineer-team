# Alembic 数据库迁移说明

## 迁移重构说明

本项目已完成数据库迁移文件的整理和重构，解决了之前碎片化的问题。

### 重构日期
2025-11-21

### 重构内容

#### 旧的迁移结构（已备份）
之前的迁移文件分散在多个文件中，按时间顺序依赖：
- `e2412789c190_initialize_models.py` - 初始化模型
- `9c0a54914c78_add_max_length_for_string_varchar_.py` - 添加字符串长度限制
- `d98dd8ec85a3_edit_replace_id_integers_in_all_models_.py` - ID从整数改为UUID
- `1a31ce608336_add_cascade_delete_relationships.py` - 添加级联删除
- `f1234567890a_add_node_table.py` - 添加Node表
- `a1234567890b_add_node_last_heartbeat.py` - 添加节点心跳字段
- `b1234567890c_add_registration_key_table.py` - 添加注册密钥表
- `c1234567890d_add_issue_table.py` - 添加Issue表
- `e3c92c171920_add_four_tables_with_timestamps.py` - 添加4个表和时间戳
- `g1234567890e_update_credentials_schema.py` - 更新凭证schema
- `1ee55d360fcb_add_owner_id_and_timestamps_to_node.py` - 添加Node的owner_id和时间戳
- `26c2c831dc19_make_node_owner_id_non_nullable.py` - 设置Node的owner_id不可空
- `0a0ed29996b1_add_timestamps_to_user.py` - 添加User时间戳
- `2b2a406df71b_add_timestamps_to_item.py` - 添加Item时间戳
- `19be435a02b1_add_workflow_log_table.py` - 添加工作流日志表

所有旧的迁移文件已移至：`backend/app/alembic/versions/backup/`

#### 新的迁移结构
现在使用单一的、清晰的初始迁移文件：
- **`001_initial_schema.py`** - 包含所有表的完整schema定义

### 新迁移文件包含的表

按照 `app/models/` 目录结构组织：

1. **User** (`user` 表)
   - 用户基本信息和认证数据
   - 字段：id (UUID), email, hashed_password, full_name, is_active, is_superuser, created_at, updated_at

2. **Project** (`project` 表)
   - 项目信息
   - 字段：id (UUID), name, description, is_active, owner_id, created_at, updated_at

3. **Repository** (`repository` 表)
   - 代码仓库信息
   - 字段：id (UUID), name, url, description, is_public, owner_id, created_at, updated_at

4. **Issue** (`issue` 表)
   - GitHub Issue或任务信息
   - 字段：id (UUID), title, description, repository_url, issue_number, status, priority, assigned_node_id, owner_id, created_at, updated_at, started_at, completed_at, error_message, result_branch

5. **Node** (`node` 表)
   - 工作节点信息
   - 字段：id (UUID), name, ip, description, tags, status, owner_id, last_heartbeat, created_at, updated_at

6. **Credential** (`credential` 表)
   - 服务认证凭证（GitHub Copilot, Cursor, Claude等）
   - 字段：id (UUID), title, category (枚举), pat, is_disabled, owner_id, created_at, updated_at

7. **Prompt** (`prompt` 表)
   - AI提示词模板
   - 字段：id (UUID), name, content, description, tags, owner_id, created_at, updated_at

8. **NodeRegistrationKey** (`node_registration_key` 表)
   - 节点注册密钥（单行表）
   - 字段：id (固定为1), key, created_at, updated_at

9. **WorkflowLog** (`workflowlog` 表)
   - Issue处理过程的工作流日志
   - 字段：id (UUID), issue_id, node_id, step_name, status, command, output, error_message, duration_ms, created_at

10. **CredentialNodeLink** (`credentialnodelink` 表)
    - 凭证和节点的多对多关联表
    - 字段：credential_id (UUID), node_id (UUID)

### 关系说明

- User 是核心表，其他多数表通过 `owner_id` 外键关联
- 所有关联 User 的外键都设置了 `ondelete='CASCADE'`，删除用户时会级联删除相关数据
- Credential 和 Node 之间是多对多关系，通过 CredentialNodeLink 关联
- WorkflowLog 关联 Issue 和 Node，记录任务执行日志

## 使用方法

### 全新数据库初始化

对于全新的数据库环境：

```bash
# 进入backend目录
cd backend

# 运行迁移
alembic upgrade head
```

### 从旧迁移升级（已有数据库）

如果您已经有使用旧迁移的数据库，需要：

1. **备份数据库**（重要！）
   ```bash
   pg_dump -U postgres -d your_database > backup_$(date +%Y%m%d).sql
   ```

2. **清理alembic版本表**
   ```sql
   -- 连接到数据库
   DELETE FROM alembic_version;
   ```

3. **标记为已迁移**（因为表已存在）
   ```bash
   # 标记初始迁移为已执行（不实际运行SQL）
   alembic stamp 001_initial_schema
   ```

### 创建新的迁移

未来添加新功能时：

```bash
# 修改models后，自动生成迁移
alembic revision --autogenerate -m "描述你的变更"

# 检查生成的迁移文件
# 编辑 backend/app/alembic/versions/xxx_描述你的变更.py

# 应用迁移
alembic upgrade head
```

### 查看迁移状态

```bash
# 查看当前版本
alembic current

# 查看迁移历史
alembic history

# 查看详细历史
alembic history --verbose
```

### 回滚迁移

```bash
# 回滚一个版本
alembic downgrade -1

# 回滚到特定版本
alembic downgrade <revision_id>

# 回滚所有迁移
alembic downgrade base
```

## 最佳实践

1. **总是备份数据库** - 在执行任何迁移操作前
2. **先在开发环境测试** - 确保迁移正确无误
3. **检查自动生成的迁移** - autogenerate可能需要手动调整
4. **使用有意义的消息** - 便于追踪变更历史
5. **保持迁移的原子性** - 每个迁移只做一件事

## 故障排除

### 迁移失败
```bash
# 查看详细错误
alembic upgrade head --sql

# 手动检查SQL语句
```

### 版本冲突
```bash
# 查看当前状态
alembic current

# 强制设置版本（谨慎使用）
alembic stamp <revision_id>
```

### 重置迁移（开发环境）
```bash
# 回滚所有
alembic downgrade base

# 删除数据库所有表
# DROP SCHEMA public CASCADE;
# CREATE SCHEMA public;

# 重新迁移
alembic upgrade head
```

## 参考资料

- [Alembic 官方文档](https://alembic.sqlalchemy.org/)
- [SQLModel 文档](https://sqlmodel.tiangolo.com/)
- [项目 Models 定义](../models/)
