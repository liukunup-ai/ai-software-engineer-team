# 🔧 Alembic 迁移快速参考

## 📋 表结构清单 (10个表)

| 表名 | 说明 | 主要字段 | 关联 |
|------|------|----------|------|
| **user** | 用户表 | id, email, hashed_password, full_name | - |
| **project** | 项目表 | id, name, description, is_active | → user |
| **repository** | 仓库表 | id, name, url, is_public | → user |
| **issue** | 问题表 | id, title, status, priority | → user |
| **node** | 节点表 | id, name, ip, status, last_heartbeat | → user |
| **credential** | 凭证表 | id, title, category, pat | → user |
| **prompt** | 提示词表 | id, name, content | → user |
| **node_registration_key** | 注册密钥 | id, key | - |
| **workflowlog** | 工作流日志 | id, issue_id, step_name, status | → issue, node |
| **credentialnodelink** | 凭证-节点关联 | credential_id, node_id | → credential, node |

## 🚀 常用命令

```bash
# 查看当前版本
alembic current

# 查看历史
alembic history

# 升级到最新
alembic upgrade head

# 降级一个版本
alembic downgrade -1

# 生成新迁移
alembic revision --autogenerate -m "描述"

# 标记版本（不运行SQL）
alembic stamp 001_initial_schema
```

## 🎯 字段类型映射

| Python/SQLModel | PostgreSQL | 说明 |
|-----------------|------------|------|
| `uuid.UUID` | `UUID` | 主键/外键 |
| `str` (max_length) | `VARCHAR(n)` | 字符串 |
| `int` | `INTEGER` | 整数 |
| `bool` | `BOOLEAN` | 布尔值 |
| `datetime` | `TIMESTAMP` | 时间戳 |
| `Enum` | `ENUM` | 枚举类型 |

## 🔗 外键约束

所有指向 `user.id` 的外键都设置了 `ondelete='CASCADE'`：
- project.owner_id
- repository.owner_id
- issue.owner_id
- node.owner_id
- credential.owner_id
- prompt.owner_id

## 📌 索引

- `user.email` - 唯一索引
- `node.name` - 普通索引
- `node_registration_key.key` - 普通索引

## 🎨 枚举类型

**CredentialCategory**:
- `github-copilot`
- `cursor`
- `cluade-code`

## ⏱️ 时间戳字段

大部分表都有：
- `created_at` - 创建时间
- `updated_at` - 更新时间

特殊：
- `user` - 有 created_at, updated_at
- `issue` - 额外有 started_at, completed_at
- `node` - 额外有 last_heartbeat
- `workflowlog` - 只有 created_at

## 🔢 ID类型

- **UUID**: 大部分表 (user, project, repository, issue, node, credential, prompt, workflowlog)
- **Integer**: node_registration_key (固定为1，单行表)

## 📖 文档位置

- [详细使用说明](versions/README.md)
- [重构总结](MIGRATION_REFACTOR.md)
- [旧迁移备份](versions/backup/)
