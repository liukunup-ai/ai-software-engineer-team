# Issue自动化处理功能实现总结

## 功能概述

实现了基于issue的自动化处理功能,包括:
- Issue状态管理(待处理、处理中、待合入、已合入、终止)
- 任务启动和分发
- Node节点自动选择
- 任务执行和结果上报

## 后端改动

### 1. 数据模型更新

#### Issue模型 (`backend/app/models/issue.py`)
- **状态更新**: 将status字段的状态值更新为:
  - `pending`: 待处理
  - `processing`: 处理中
  - `pending_merge`: 待合入
  - `merged`: 已合入
  - `terminated`: 终止

#### 新增Task模型 (`backend/app/models/task.py`)
创建了新的Task模型用于记录任务:
- `issue_id`: 关联的Issue ID
- `node_id`: 分配的Node ID
- `status`: 任务状态(pending/running/success/failed)
- `command`: 下发给node的命令
- `result_branch`: 处理结果的分支名
- `error_message`: 错误信息
- 时间字段: created_at, updated_at, started_at, completed_at

#### User模型更新 (`backend/app/models/user.py`)
- 添加了tasks关系,支持查询用户的所有任务

### 2. API端点新增

#### 启动任务API (`POST /api/v1/issues/{id}/start`)
功能流程:
1. 验证issue存在且状态可启动
2. 查询issue关联的仓库
3. 自动选择空闲的node(使用NodeSelectionService)
4. 查询node的可用凭证
5. 更新issue状态为processing
6. 创建task记录
7. 通过HTTP请求下发任务到node

请求示例:
```json
POST /api/v1/issues/{issue_id}/start
{
  "command": "process issue #123"  // 可选
}
```

响应: 返回TaskPublic对象

#### 上报分支API (`POST /api/v1/issues/{id}/report-branch`)
Node节点完成任务后调用此API上报结果:

请求示例:
```json
POST /api/v1/issues/{issue_id}/report-branch
{
  "task_id": "uuid",
  "branch_name": "feature/issue-123",
  "status": "success",  // success/failed
  "error_message": null  // 可选
}
```

功能:
- 更新task状态和结果
- 根据成功/失败更新issue状态为pending_merge或terminated
- 记录result_branch

### 3. 数据库迁移

创建了新的迁移文件 (`002_add_task_table_and_update_issue_status.py`):
- 创建task表
- 更新现有issue的状态值(completed->pending_merge, failed->terminated)

运行迁移:
```bash
cd backend
alembic upgrade head
```

### 4. 依赖服务

使用了现有的NodeSelectionService来智能选择最优节点:
- 优先选择在线且健康的节点
- 考虑节点负载
- 支持标签匹配

## 前端改动

### 1. Issues列表页面 (`frontend/src/routes/_layout/issues.tsx`)

#### 状态显示优化
- 添加了`getStatusLabel`函数,将英文状态转换为中文
- 更新了`getStatusColor`函数,支持新的状态颜色:
  - pending: gray (待处理)
  - processing: blue (处理中)
  - pending_merge: yellow (待合入)
  - merged: green (已合入)
  - terminated: red (已终止)

#### 表格列更新
- 新增"Start"列用于显示启动按钮

### 2. 新增StartIssueButton组件 (`frontend/src/components/Issues/StartIssueButton.tsx`)

功能特性:
- 根据issue状态显示不同的按钮样式和文本
- 状态映射:
  - `pending`: 显示"启动"按钮(蓝色,可点击)
  - `processing`: 显示"运行中"按钮(蓝色,禁用,带旋转图标)
  - `pending_merge`: 显示"待合入"按钮(黄色,禁用)
  - `merged`: 显示"已合入"按钮(绿色,禁用)
  - `terminated`: 显示"重新启动"按钮(橙色,可点击)

技术实现:
- 使用React Query的useMutation处理API调用
- 调用成功后自动刷新issues列表
- 包含错误处理和toast提示

## Node端要求

Node端需要实现以下API端点:

### 接收任务端点 (`POST http://{node_ip}:8007/process-issue`)

请求数据:
```json
{
  "issue_id": "uuid",
  "task_id": "uuid",
  "repository_url": "https://github.com/owner/repo",
  "issue_number": 123,
  "issue_title": "Issue标题",
  "issue_description": "Issue描述",
  "credential_token": "ghp_xxx",
  "command": "process issue #123"
}
```

Node处理流程:
1. 设置凭证(PAT)环境变量
2. 认证检查
3. git clone拉取仓库到工作目录
4. 创建特定分支
5. 执行AI coding命令
6. git commit提交代码
7. git push推送代码
8. 调用服务端API上报分支名

上报API调用示例:
```bash
curl -X POST "http://server:8000/api/v1/issues/{issue_id}/report-branch" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "uuid",
    "branch_name": "feature/issue-123",
    "status": "success"
  }'
```

## 使用流程

### 管理员操作流程

1. **创建Issue**: 在系统中创建或从GitHub同步issue
2. **启动任务**: 点击issue列表中的"启动"按钮
3. **系统处理**:
   - 自动选择可用node
   - 下发任务到node
   - issue状态变为"处理中"
4. **等待完成**: node处理完成后自动上报
5. **合入代码**: issue状态变为"待合入",可以review并合并代码

### 状态转换流程

```
pending (待处理)
  ↓ [点击启动]
processing (处理中)
  ↓ [node成功完成]
pending_merge (待合入)
  ↓ [手动合入]
merged (已合入)

或

processing (处理中)
  ↓ [node失败]
terminated (终止)
  ↓ [点击重新启动]
processing (处理中)
```

## 待完成工作

1. **重新生成前端client**:
   ```bash
   cd backend
   # 启动后端服务
   cd ../frontend
   npm run generate-client
   ```
   然后更新StartIssueButton.tsx中的API调用,使用生成的client方法

2. **实现Node端处理逻辑**:
   - 创建/process-issue端点
   - 实现git操作流程
   - 集成AI coding工具
   - 实现结果上报

3. **测试流程**:
   - 创建测试issue
   - 配置测试node和credential
   - 端到端测试整个流程

## 配置要求

### 后端环境变量
无需新增环境变量

### Node要求
- 需要能够执行git命令
- 需要能够接收HTTP请求
- 需要配置可用的GitHub PAT凭证
- 需要足够的磁盘空间用于clone仓库

## 安全考虑

1. **凭证管理**: PAT通过加密存储,只在需要时传递给node
2. **权限验证**: 启动任务需要管理员权限或issue所有者权限
3. **Node认证**: 建议在生产环境中为node端点添加认证
4. **错误处理**: 任务失败时会记录错误信息,方便排查问题

## 下一步优化建议

1. **任务队列**: 实现任务队列机制,支持批量处理
2. **实时状态**: 添加WebSocket支持,实时更新处理进度
3. **日志查看**: 在前端添加任务日志查看功能
4. **重试机制**: 自动重试失败的任务
5. **通知功能**: 任务完成后通过邮件/webhook通知
6. **统计报表**: 添加任务执行统计和分析功能
