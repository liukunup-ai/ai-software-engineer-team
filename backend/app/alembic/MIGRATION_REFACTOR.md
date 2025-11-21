# Alembic 迁移重构总结

## 📋 重构概览

**日期**: 2025-11-21  
**目标**: 整理合并碎片化的alembic迁移文件，按照models结构组织  
**状态**: ✅ 完成

---

## 🔄 变更内容

### 重构前
- **迁移文件数**: 15个
- **依赖链长度**: 15级
- **主要问题**:
  - 碎片化严重，难以维护
  - 多次修改同一表（User、Node等）
  - 包含历史重构遗留（Integer → UUID）
  - 缺乏清晰的组织结构

### 重构后
- **迁移文件数**: 1个
- **文件名**: `001_initial_schema.py`
- **优势**:
  - ✅ 单一清晰的初始schema
  - ✅ 按models目录结构组织
  - ✅ 包含所有表的完整定义
  - ✅ 详细的中文注释说明
  - ✅ 便于维护和理解

---

## 📊 数据库表结构

新迁移文件包含以下10个表：

### 核心表
1. **user** - 用户表（核心，其他表的owner）
2. **project** - 项目表
3. **repository** - 代码仓库表
4. **issue** - 问题/任务表
5. **node** - 工作节点表

### 配置表
6. **credential** - 认证凭证表
7. **prompt** - AI提示词表
8. **node_registration_key** - 节点注册密钥表（单行表）

### 日志表
9. **workflowlog** - 工作流执行日志表

### 关联表
10. **credentialnodelink** - 凭证-节点多对多关联表

---

## 📁 文件结构

```
backend/app/alembic/versions/
├── 001_initial_schema.py          # 新的统一迁移文件
├── README.md                       # 迁移使用说明文档
└── backup/                         # 旧迁移文件备份
    ├── README.md                   # 备份说明文档
    ├── e2412789c190_initialize_models.py
    ├── 9c0a54914c78_add_max_length_for_string_varchar_.py
    ├── d98dd8ec85a3_edit_replace_id_integers_in_all_models_.py
    ├── 1a31ce608336_add_cascade_delete_relationships.py
    ├── f1234567890a_add_node_table.py
    ├── a1234567890b_add_node_last_heartbeat.py
    ├── b1234567890c_add_registration_key_table.py
    ├── c1234567890d_add_issue_table.py
    ├── e3c92c171920_add_four_tables_with_timestamps.py
    ├── g1234567890e_update_credentials_schema.py
    ├── 1ee55d360fcb_add_owner_id_and_timestamps_to_node.py
    ├── 26c2c831dc19_make_node_owner_id_non_nullable.py
    ├── 0a0ed29996b1_add_timestamps_to_user.py
    ├── 2b2a406df71b_add_timestamps_to_item.py
    └── 19be435a02b1_add_workflow_log_table.py
```

---

## 🎯 新迁移文件特点

### 1. 完整的Schema定义
包含所有当前models中定义的表结构，无遗漏。

### 2. 清晰的组织结构
按照 `app/models/` 目录的顺序组织：
- user.py → user 表
- project.py → project 表
- repository.py → repository 表
- issue.py → issue 表
- node.py → node 表
- credential.py → credential 表
- prompt.py → prompt 表
- registration_key.py → node_registration_key 表
- workflow_log.py → workflowlog 表
- common.py → credentialnodelink 表

### 3. 详细的注释
每个表都有中文注释，说明用途和字段含义。

### 4. 正确的约束和索引
- 主键: UUID (除 node_registration_key 使用 Integer)
- 外键: 正确设置级联删除 (CASCADE)
- 索引: user.email, node.name, node_registration_key.key
- 枚举: CredentialCategory (github-copilot, cursor, cluade-code)

---

## 🚀 使用方法

### 全新数据库
```bash
cd backend
alembic upgrade head
```

### 已有数据库（从旧迁移升级）
```bash
# 1. 备份数据库（重要！）
pg_dump -U postgres -d your_database > backup_$(date +%Y%m%d).sql

# 2. 清理版本表
psql -U postgres -d your_database -c "DELETE FROM alembic_version;"

# 3. 标记为已迁移（表已存在，不实际运行SQL）
cd backend
alembic stamp 001_initial_schema
```

### 未来添加新迁移
```bash
# 修改models后
alembic revision --autogenerate -m "描述变更"

# 检查并编辑生成的文件
# 然后应用
alembic upgrade head
```

---

## ⚠️ 重要说明

### 1. 备份文件的用途
- ✅ 可用于历史追溯
- ✅ 可用于理解表结构演进
- ❌ 不应用于新数据库初始化
- ❌ 不应作为迁移链的一部分

### 2. 数据迁移
本次重构**不影响现有数据**：
- 表结构完全一致
- 仅重组了迁移文件
- 对于已有数据库，使用 `alembic stamp` 标记即可

### 3. 回滚方案
如需回退到旧迁移结构：
```bash
# 从backup恢复旧文件
cp backup/*.py .

# 删除新文件
rm 001_initial_schema.py
```

---

## ✅ 验证清单

- [x] 所有旧迁移文件已备份到 backup/ 目录
- [x] 创建了统一的 001_initial_schema.py
- [x] 迁移文件语法正确（已验证）
- [x] 包含所有10个表的定义
- [x] 外键约束正确设置
- [x] 索引正确创建
- [x] 枚举类型正确定义
- [x] 创建了详细的使用文档（README.md）
- [x] 创建了备份说明文档（backup/README.md）
- [x] 创建了总结文档（本文件）

---

## 📚 相关文档

- [迁移使用说明](README.md) - 详细的使用指南
- [备份说明](backup/README.md) - 旧迁移文件的说明
- [Models定义](../models/) - 数据模型源代码

---

## 🎉 总结

通过本次重构：
1. **简化了维护** - 从15个文件减少到1个
2. **提高了可读性** - 清晰的结构和注释
3. **便于理解** - 按models组织，一目了然
4. **保留了历史** - 旧文件完整备份，可随时参考
5. **不影响数据** - 表结构完全一致，安全可靠

未来添加新功能时，只需从这个清晰的基础上添加新的迁移文件即可。

---

**维护者**: AI Software Engineer Team  
**最后更新**: 2025-11-21
