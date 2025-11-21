# Alembic 迁移修复总结

## 问题描述

在执行 alembic 命令时遇到以下错误：
```
ERROR [alembic.util.messaging] Can't locate revision identified by 'e3c92c171920'
```

## 问题根因

1. **迁移文件碎片化**：存在16个零散的迁移文件，管理复杂且容易出错
2. **缓存不一致**：`__pycache__` 目录中保留了已删除迁移文件的缓存
3. **版本记录冲突**：数据库 `alembic_version` 表记录的版本号与实际迁移文件不匹配

## 解决方案

### 第一步：清理缓存
```bash
rm -rf app/alembic/versions/__pycache__/*
```

### 第二步：更新数据库版本记录
创建并执行 Python 脚本直接更新 `alembic_version` 表：
```sql
DELETE FROM alembic_version;
INSERT INTO alembic_version (version_num) VALUES ('001_initial_schema');
```

### 第三步：生成同步迁移
由于数据库 schema 与新的模型定义不完全一致，生成了一个同步迁移：
```bash
alembic revision --autogenerate -m "sync_models_with_database"
```

### 第四步：修复迁移文件
修复了自动生成的迁移文件中的问题：
1. **ENUM 类型创建**：在使用 ENUM 类型之前先创建它
2. **NOT NULL 约束**：为新增的 NOT NULL 列添加 `server_default` 值
3. **外键约束**：正确处理 `owner_id` 的添加顺序

### 第五步：应用迁移
```bash
alembic upgrade head
```

## 最终结果

✅ **成功解决所有问题！**

### 当前状态
```bash
$ alembic current
318e2657ad46 (head)

$ alembic check
No new upgrade operations detected.
```

### 迁移历史
```
<base> -> 001_initial_schema -> 318e2657ad46 (head)
```

### 迁移文件结构
- ✅ `001_initial_schema.py` - 初始完整 schema（按 models 组织）
- ✅ `318e2657ad46_sync_models_with_database.py` - 同步更新
- 📁 `backup/` - 备份的旧迁移文件（16个文件）

## 重要变更

### 318e2657ad46 迁移包含的更新：

1. **新增表**
   - `credentialnodelink` - 凭证与节点的关联表

2. **删除表**
   - `item` - 旧的示例表

3. **credential 表更新**
   - 新增字段：`category`（ENUM）、`pat`、`is_disabled`
   - 删除字段：`description`、`service`、`username`、`password`

4. **node 表更新**
   - 新增字段：`owner_id`（外键）、`created_at`、`updated_at`

5. **user 表更新**
   - 新增字段：`created_at`、`updated_at`

6. **repository 表更新**
   - `url` 字段：VARCHAR(500) -> AutoString(1023)

## 经验教训

1. **定期合并迁移**：避免迁移文件过度碎片化
2. **清理缓存**：删除/移动迁移文件后务必清理 `__pycache__`
3. **使用 server_default**：为现有表添加 NOT NULL 列时提供默认值
4. **创建 ENUM 前置**：使用 PostgreSQL ENUM 类型前先创建类型定义
5. **备份迁移历史**：重组前备份所有旧迁移文件

## 后续建议

1. **定期检查**：运行 `alembic check` 验证 schema 一致性
2. **合并策略**：每个功能模块一个迁移文件，避免过度细分
3. **版本控制**：确保 `alembic_version` 表与代码仓库同步
4. **测试环境**：在生产环境前先在测试环境验证迁移

---
**修复日期**: 2025-11-21  
**修复人员**: AI Assistant  
**状态**: ✅ 已完成
