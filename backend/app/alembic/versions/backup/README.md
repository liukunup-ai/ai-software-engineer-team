# 旧迁移文件备份

本目录包含重构前的所有迁移文件，已于 2025-11-21 备份。

## 迁移链（按执行顺序）

1. **e2412789c190** - Initialize models
   - 创建最初的 user 和 item 表
   - User ID 使用 Integer
   
2. **9c0a54914c78** - Add max length for string(varchar) fields in User and Items models
   - 为字符串字段添加长度限制

3. **d98dd8ec85a3** - Edit replace id integers in all models to use UUID instead
   - 将所有表的 ID 从 Integer 改为 UUID
   - 重大结构变更

4. **1a31ce608336** - Add cascade delete relationships
   - 添加级联删除关系

5. **f1234567890a** - Add Node table
   - 创建 Node 表（初版）

6. **a1234567890b** - Add node last_heartbeat
   - 添加节点心跳时间字段

7. **b1234567890c** - Add NodeRegistrationKey table
   - 创建节点注册密钥表

8. **c1234567890d** - Add issue table
   - 创建 Issue 表

9. **e3c92c171920** - Add four tables with timestamps
   - 创建 credential, project, prompt, repository 四个表
   - 包含时间戳字段

10. **g1234567890e** - Update credential schema for categories, PAT, and node links
    - 更新凭证表结构
    - 添加 category 枚举、PAT 字段
    - 创建 credentialnodelink 关联表

11. **1ee55d360fcb** - Add owner_id and timestamps to node
    - 为 Node 添加 owner_id 和时间戳

12. **26c2c831dc19** - Make node owner_id non-nullable
    - 将 Node 的 owner_id 设为非空

13. **0a0ed29996b1** - Add timestamps to user
    - 为 User 添加时间戳字段

14. **2b2a406df71b** - Add timestamps to item
    - 为 Item 添加时间戳字段

15. **19be435a02b1** - Add workflow_log table
    - 创建工作流日志表

## 为什么重构？

### 问题
1. **碎片化严重** - 15个迁移文件，维护困难
2. **依赖链复杂** - 迁移之间相互依赖，难以理解
3. **增量修改多** - 多次修改同一个表（如 Node、User）
4. **历史包袱** - 包含 Integer → UUID 的大重构

### 解决方案
- 创建单一的 `001_initial_schema.py` 
- 包含所有表的完整、正确的schema定义
- 按models目录结构组织，清晰易懂
- 统一所有字段定义和约束

## 这些文件的用途

这些备份文件：
- ✅ 可用于参考历史变更
- ✅ 可用于理解表结构演进
- ❌ 不应再用于新的数据库初始化
- ❌ 不应作为迁移链的一部分

## 如果需要历史追溯

如果需要查看某个表的演进历史，可以按顺序查看相关文件：

### Node表的演进
1. `f1234567890a_add_node_table.py` - 创建
2. `a1234567890b_add_node_last_heartbeat.py` - 添加心跳
3. `1ee55d360fcb_add_owner_id_and_timestamps_to_node.py` - 添加所有者和时间戳
4. `26c2c831dc19_make_node_owner_id_non_nullable.py` - 设置非空约束

### Credential表的演进
1. `e3c92c171920_add_four_tables_with_timestamps.py` - 创建（旧schema）
2. `g1234567890e_update_credentials_schema.py` - 更新为新schema

### User表的演进
1. `e2412789c190_initialize_models.py` - 创建（Integer ID）
2. `9c0a54914c78_add_max_length_for_string_varchar_.py` - 添加长度
3. `d98dd8ec85a3_edit_replace_id_integers_in_all_models_.py` - 改为UUID
4. `0a0ed29996b1_add_timestamps_to_user.py` - 添加时间戳

---

**重要提醒**: 这些文件仅供参考，请使用新的统一迁移文件 `001_initial_schema.py`。
