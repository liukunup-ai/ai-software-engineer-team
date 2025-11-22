# Issue自动化处理 - 快速使用指南

## 启动步骤

### 1. 运行数据库迁移

首先需要应用数据库迁移以创建task表:

```bash
cd backend
alembic upgrade head
```

### 2. 重启服务

如果服务正在运行,需要重启以加载新的模型和API:

```bash
# 使用docker compose
docker compose restart backend

# 或者手动重启
cd backend
fastapi dev app/main.py
```

### 3. 重新生成前端Client (可选但推荐)

为了使用类型安全的API调用:

```bash
# 确保后端服务正在运行
cd backend
python -c "import app.main; import json; print(json.dumps(app.main.app.openapi()))" > ../openapi.json
cd ..
mv openapi.json frontend/
cd frontend
npm run generate-client
```

然后更新 `frontend/src/components/Issues/StartIssueButton.tsx` 中的API调用:

```typescript
// 替换现有的fetch调用为:
import { IssuesService } from "@/client"

// 在mutation中:
mutationFn: async () => {
  const response = await IssuesService.startIssueTask({ 
    id: issue.id,
    requestBody: {}
  })
  return response
},
```

## 功能测试

### 前提条件

1. **配置Node节点**:
   - 在系统中添加至少一个node
   - Node状态必须为"online"
   - Node的IP地址可访问

2. **配置凭证**:
   - 为node关联至少一个GitHub PAT凭证
   - 凭证需要有仓库读写权限

### 测试流程

#### 1. 创建测试Issue

在Issues页面点击"Add Issue"按钮,创建一个测试issue:

- Title: "测试自动化处理"
- Description: "测试issue自动化处理功能"
- Repository URL: "https://github.com/your-org/your-repo"
- Issue Number: 1
- Priority: 1

#### 2. 启动任务

在Issues列表中,找到刚创建的issue,点击"启动"按钮:

1. 系统会自动选择一个可用的node
2. Issue状态变为"处理中"
3. 按钮变为"运行中"(禁用状态)

#### 3. 查看任务详情

可以在后台查询任务详情:

```bash
# 使用API查询
curl -X GET "http://localhost:8000/api/v1/issues/{issue_id}" \
  -H "Authorization: Bearer {your_token}"
```

#### 4. 模拟Node完成处理

由于Node端处理逻辑尚未实现,可以手动调用上报API进行测试:

```bash
curl -X POST "http://localhost:8000/api/v1/issues/{issue_id}/report-branch" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {your_token}" \
  -d '{
    "task_id": "{task_id}",
    "branch_name": "feature/test-issue-1",
    "status": "success"
  }'
```

成功后:
- Issue状态变为"待合入"
- result_branch字段记录了分支名

#### 5. 测试失败场景

测试任务失败的情况:

```bash
curl -X POST "http://localhost:8000/api/v1/issues/{issue_id}/report-branch" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {your_token}" \
  -d '{
    "task_id": "{task_id}",
    "branch_name": "",
    "status": "failed",
    "error_message": "Git push failed"
  }'
```

失败后:
- Issue状态变为"已终止"
- 按钮变为"重新启动"(可点击)

#### 6. 重新启动

对于状态为"已终止"的issue,可以点击"重新启动"按钮再次执行任务。

## 常见问题

### 1. 点击启动后无响应

**可能原因**:
- 没有可用的node (检查node状态是否为online)
- Node没有关联凭证
- 网络连接问题

**解决方法**:
- 检查Nodes页面,确保有在线的node
- 为node添加凭证
- 查看后端日志了解详细错误

### 2. 任务一直处于"处理中"状态

**可能原因**:
- Node端未能成功接收任务
- Node端处理失败但未上报
- Node端地址配置错误

**解决方法**:
- 检查node的IP地址配置
- 查看node端日志
- 手动调用上报API更新状态

### 3. 提示"No available node found"

**可能原因**:
- 所有node都处于离线状态
- Node心跳超时

**解决方法**:
- 检查node服务是否运行
- 确保node定期发送心跳
- 更新node状态为online

## API端点列表

### 后端API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/v1/issues/{id}/start` | POST | 启动issue任务 |
| `/api/v1/issues/{id}/report-branch` | POST | Node上报处理结果 |
| `/api/v1/issues/{id}` | GET | 查询issue详情 |
| `/api/v1/issues` | GET | 获取issues列表 |

### Node端API (需要实现)

| 端点 | 方法 | 说明 |
|------|------|------|
| `http://{node_ip}:8007/process-issue` | POST | 接收并处理任务 |

## 下一步

1. **实现Node端处理逻辑**: 参考 `ISSUE_AUTOMATION_IMPLEMENTATION.md` 中的Node端要求
2. **添加日志查看**: 在前端添加任务执行日志查看功能
3. **集成WebSocket**: 实现实时状态更新
4. **添加更多测试**: 编写单元测试和集成测试

## 监控和调试

### 查看后端日志

```bash
# Docker环境
docker compose logs -f backend

# 本地开发
# 日志会在终端直接显示
```

### 查看数据库记录

```bash
# 连接到数据库
docker exec -it {postgres_container} psql -U {username} -d {database}

# 查询issue
SELECT id, title, status, assigned_node_id, result_branch FROM issue;

# 查询task
SELECT id, issue_id, node_id, status, result_branch, error_message FROM task;
```

### 调试提示

1. 使用浏览器开发者工具查看网络请求
2. 检查API响应的错误信息
3. 查看后端日志了解详细的处理流程
4. 使用Swagger UI测试API: http://localhost:8000/docs
