# Node Service - AI Coding Agent

Node服务是执行AI编码任务的工作节点。

## 功能

- 接收服务端下发的任务
- 执行git操作(clone, branch, commit, push)
- 运行AI coding工具
- 上报任务结果

## API端点

### 1. 接收任务 - POST /process-issue

处理issue任务。

**请求体**:
```json
{
  "issue_id": "uuid",
  "task_id": "uuid",
  "repository_url": "https://github.com/owner/repo",
  "issue_number": 123,
  "issue_title": "Issue标题",
  "issue_content": "Issue描述",
  "credential_token": "ghp_xxx",
  "command": "process issue #123"
}
```

**响应**:
```json
{
  "status": "accepted",
  "message": "Task accepted and processing started"
}
```

### 2. 执行命令 - POST /execute

执行shell命令(已有实现)。

**请求体**:
```json
{
  "command": "ls",
  "args": ["-la"]
}
```

### 3. 健康检查 - POST /heartbeat

向服务端报告心跳(已有实现)。

## 环境变量

- `SERVER_URL`: 主服务器URL (例如: http://server:8000)
- `NODE_PORT`: Node服务端口 (默认: 8007)
- `WORKSPACE_DIR`: 工作目录 (默认: /workspace)

## 部署

### Docker部署

```bash
docker run -d \
  -e SERVER_URL="http://server:8000" \
  -e NODE_PORT="8007" \
  -v /path/to/workspace:/workspace \
  your-node-image
```

### 本地开发

```bash
cd node
pip install -r requirements.txt
python main.py
```

## 实现说明

请参考 `main.py` 中的示例实现。
