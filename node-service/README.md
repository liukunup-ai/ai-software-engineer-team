# Node Service

AI编码任务的工作节点服务。

## 功能

- ✅ 接收并处理来自主服务器的issue任务
- ✅ 执行Git操作(clone, branch, commit, push)
- ✅ 自动上报任务结果
- 🔄 执行AI coding (当前为demo模式，需集成实际AI工具)

## 快速启动

### 本地运行

```bash
# 安装依赖
pip install -r requirements.txt

# 配置环境变量
export SERVER_URL=http://localhost:8000
export NODE_PORT=8007
export WORKSPACE_DIR=/tmp/workspace

# 启动服务
python main.py
```

### Docker运行

```bash
# 构建镜像
docker build -t ai-node-service .

# 运行容器
docker run -d \
  --name ai-node \
  -p 8007:8007 \
  -e SERVER_URL=http://backend:8000 \
  -v $(pwd)/workspace:/workspace \
  ai-node-service
```

### Docker Compose

在项目根目录的 `docker-compose.yml` 中添加:

```yaml
  node:
    build:
      context: ./node-service
      dockerfile: Dockerfile
    ports:
      - "8007:8007"
    environment:
      - SERVER_URL=http://backend:8000
      - NODE_PORT=8007
      - WORKSPACE_DIR=/workspace
    volumes:
      - node-workspace:/workspace
    networks:
      - app-network

volumes:
  node-workspace:
```

## API端点

### POST /process-issue

接收并处理issue任务。

**请求示例**:
```json
{
  "issue_id": "550e8400-e29b-41d4-a716-446655440000",
  "task_id": "650e8400-e29b-41d4-a716-446655440001",
  "repository_url": "https://github.com/owner/repo",
  "issue_number": 123,
  "issue_title": "Fix bug in authentication",
  "issue_description": "Users cannot login...",
  "credential_token": "ghp_xxxxx",
  "command": "process issue #123"
}
```

**响应**:
```json
{
  "status": "accepted",
  "message": "Task 650e8400-e29b-41d4-a716-446655440001 accepted and processing started"
}
```

### POST /execute

执行shell命令。

**请求示例**:
```json
{
  "command": "ls",
  "args": ["-la", "/workspace"]
}
```

**响应**:
```json
{
  "exit_code": 0,
  "stdout": "total 8\ndrwxr-xr-x ...",
  "stderr": ""
}
```

### GET /health

健康检查。

**响应**:
```json
{
  "status": "healthy",
  "service": "node"
}
```

## 处理流程

当接收到 `/process-issue` 请求时，Node会执行以下步骤:

1. **设置Git凭证**: 使用提供的PAT token
2. **创建工作目录**: `/workspace/issue-{issue_number}`
3. **Clone仓库**: 使用认证URL clone仓库
4. **创建分支**: `ai/issue-{issue_number}`
5. **执行AI coding**: 运行AI工具修改代码 (当前为demo)
6. **提交代码**: git add & commit
7. **推送远程**: git push到新分支
8. **上报结果**: 调用服务端API报告成功/失败

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `SERVER_URL` | 主服务器URL | `http://localhost:8000` |
| `NODE_PORT` | Node服务端口 | `8007` |
| `WORKSPACE_DIR` | 工作目录路径 | `/workspace` |

## 集成AI工具

当前实现是demo模式，需要集成实际的AI coding工具。可以集成以下工具:

### 1. GitHub Copilot CLI

```python
# 在process_issue_task函数中的AI coding部分
copilot_result = run_command(
    "gh", 
    ["copilot", "suggest", "-t", "shell", request.issue_description],
    cwd=str(workspace)
)
```

### 2. Cursor API

```python
# 调用Cursor API
async with httpx.AsyncClient() as client:
    response = await client.post(
        "https://cursor.api/v1/chat",
        json={
            "prompt": request.issue_description,
            "context": workspace
        }
    )
```

### 3. Claude Code

```python
# 集成Claude API
from anthropic import Anthropic

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    messages=[{
        "role": "user",
        "content": f"Fix this issue: {request.issue_description}"
    }]
)
```

## 注册Node到主服务器

启动后需要在主服务器的UI中注册这个node:

1. 登录主服务器
2. 进入 Nodes 页面
3. 点击 "Add Node"
4. 填写信息:
   - Name: "AI Node 1"
   - IP: "localhost" (或实际IP)
   - Status: "online"
5. 添加凭证并关联到这个node

## 测试

### 测试命令执行

```bash
curl -X POST http://localhost:8007/execute \
  -H "Content-Type: application/json" \
  -d '{
    "command": "echo",
    "args": ["Hello from node!"]
  }'
```

### 测试任务处理

```bash
curl -X POST http://localhost:8007/process-issue \
  -H "Content-Type: application/json" \
  -d '{
    "issue_id": "test-id",
    "task_id": "test-task",
    "repository_url": "https://github.com/your/repo",
    "issue_number": 1,
    "issue_title": "Test Issue",
    "credential_token": "your-github-token",
    "command": "test"
  }'
```

## 日志

查看处理日志:

```bash
# Docker环境
docker logs -f ai-node

# 本地环境
# 日志直接输出到终端
```

## 故障排查

### 问题: Git clone失败

**原因**: 凭证无效或仓库不存在

**解决**: 检查GitHub PAT token权限，确保有仓库访问权限

### 问题: Push失败

**原因**: 没有推送权限

**解决**: 确保PAT token有 `repo` 权限

### 问题: 无法连接到服务器

**原因**: SERVER_URL配置错误

**解决**: 检查环境变量，确保可以访问主服务器

## 生产环境部署建议

1. **使用持久化存储**: 将workspace挂载到持久化卷
2. **添加认证**: 为API端点添加token认证
3. **限制资源**: 设置CPU和内存限制
4. **日志收集**: 集成日志收集系统
5. **监控告警**: 添加Prometheus metrics
6. **自动重启**: 配置容器自动重启策略

## 下一步优化

- [ ] 集成实际的AI coding工具
- [ ] 添加任务队列支持并发处理
- [ ] 实现更细粒度的进度报告
- [ ] 添加代码审查功能
- [ ] 支持多种VCS (Git, SVN等)
- [ ] 添加沙箱隔离
