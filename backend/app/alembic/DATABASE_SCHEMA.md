# 数据库表关系图

```
                                    ┌──────────────────────┐
                                    │       user           │
                                    │──────────────────────│
                                    │ id (PK, UUID)        │
                                    │ email (UNIQUE)       │
                                    │ hashed_password      │
                                    │ full_name            │
                                    │ is_active            │
                                    │ is_superuser         │
                                    │ created_at           │
                                    │ updated_at           │
                                    └──────────────────────┘
                                             │
                ┌────────────────────────────┼────────────────────────────┐
                │                            │                            │
                │                            │                            │
    ┌───────────▼───────────┐   ┌───────────▼───────────┐   ┌───────────▼───────────┐
    │     project           │   │    repository         │   │      issue            │
    │───────────────────────│   │───────────────────────│   │───────────────────────│
    │ id (PK, UUID)         │   │ id (PK, UUID)         │   │ id (PK, UUID)         │
    │ owner_id (FK) ───────►│   │ owner_id (FK) ───────►│   │ owner_id (FK) ───────►│
    │ name                  │   │ name                  │   │ title                 │
    │ description           │   │ url                   │   │ description           │
    │ is_active             │   │ description           │   │ repository_url        │
    │ created_at            │   │ is_public             │   │ issue_number          │
    │ updated_at            │   │ created_at            │   │ status                │
    └───────────────────────┘   │ updated_at            │   │ priority              │
                                └───────────────────────┘   │ assigned_node_id      │
                                                            │ started_at            │
                ┌────────────────────────────┐              │ completed_at          │
                │                            │              │ error_message         │
                │                            │              │ result_branch         │
    ┌───────────▼───────────┐   ┌───────────▼───────────┐  │ created_at            │
    │      node             │   │    credential         │  │ updated_at            │
    │───────────────────────│   │───────────────────────│  └───────────┬───────────┘
    │ id (PK, UUID)         │   │ id (PK, UUID)         │              │
    │ owner_id (FK) ───────►│   │ owner_id (FK) ───────►│              │
    │ name                  │   │ title                 │              │
    │ ip                    │   │ category (ENUM)       │              │
    │ description           │   │ pat                   │              │
    │ tags                  │   │ is_disabled           │              │
    │ status                │   │ created_at            │              │
    │ last_heartbeat        │   │ updated_at            │              │
    │ created_at            │   └───────────┬───────────┘              │
    │ updated_at            │               │                          │
    └───────────┬───────────┘               │                          │
                │                           │                          │
                │       ┌───────────────────┘                          │
                │       │                                              │
                │       │                                              │
    ┌───────────▼───────▼───────────┐              ┌──────────────────▼──────────┐
    │  credentialnodelink           │              │      workflowlog            │
    │───────────────────────────────│              │─────────────────────────────│
    │ credential_id (PK, FK)        │              │ id (PK, UUID)               │
    │ node_id (PK, FK)              │              │ issue_id (FK) ─────────────►│
    └───────────────────────────────┘              │ node_id (FK) ───────────────┤
                                                   │ step_name                   │
                                                   │ status                      │
    ┌──────────────────────┐                      │ command                     │
    │      prompt          │                      │ output                      │
    │──────────────────────│                      │ error_message               │
    │ id (PK, UUID)        │                      │ duration_ms                 │
    │ owner_id (FK) ──────►│                      │ created_at                  │
    │ name                 │                      └─────────────────────────────┘
    │ content              │
    │ description          │
    │ tags                 │
    │ created_at           │
    │ updated_at           │
    └──────────────────────┘


    ┌────────────────────────────────┐
    │  node_registration_key         │
    │────────────────────────────────│
    │ id (PK, Integer) = 1           │  ← 单行表
    │ key                            │
    │ created_at                     │
    │ updated_at                     │
    └────────────────────────────────┘
```

## 关系说明

### 一对多关系 (1:N)
- **user** → **project**: 一个用户可以创建多个项目
- **user** → **repository**: 一个用户可以创建多个仓库
- **user** → **issue**: 一个用户可以创建多个问题
- **user** → **node**: 一个用户可以拥有多个节点
- **user** → **credential**: 一个用户可以创建多个凭证
- **user** → **prompt**: 一个用户可以创建多个提示词
- **issue** → **workflowlog**: 一个问题可以有多条工作流日志
- **node** → **workflowlog**: 一个节点可以执行多个工作流

### 多对多关系 (N:M)
- **credential** ↔ **node**: 通过 `credentialnodelink` 表
  - 一个凭证可以分配给多个节点
  - 一个节点可以使用多个凭证

### 特殊关系
- **issue.assigned_node_id**: 软引用到 node（无外键约束）

## 级联删除 (CASCADE)

删除用户时，会自动删除：
- ✅ 该用户的所有项目
- ✅ 该用户的所有仓库
- ✅ 该用户的所有问题
- ✅ 该用户的所有节点
- ✅ 该用户的所有凭证
- ✅ 该用户的所有提示词

删除问题或节点时，相关的工作流日志会受影响（取决于数据库配置）。

## 图例说明

- **PK** = Primary Key (主键)
- **FK** = Foreign Key (外键)
- **UNIQUE** = 唯一约束
- **ENUM** = 枚举类型
- **───►** = 外键关系
- **UUID** = 使用UUID作为ID
- **Integer** = 使用整数作为ID
