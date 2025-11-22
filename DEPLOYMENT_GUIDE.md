# Issue自动化处理功能 - 完整部署指南

## 🎉 功能已完成

所有必需的功能已经实现并测试通过！

## 📋 已完成的工作

### ✅ 后端 (Backend)

1. **数据模型**
   - ✅ Issue模型状态更新(pending/processing/pending_merge/merged/terminated)
   - ✅ 新增Task模型用于记录任务
   - ✅ User模型添加tasks关系

2. **API端点**
   - ✅ `POST /api/v1/issues/{id}/start` - 启动任务
   - ✅ `POST /api/v1/issues/{id}/report-branch` - 上报结果

3. **数据库迁移**
   - ✅ 已创建并执行迁移(002_add_task_table)
   - ✅ task表已创建
   - ✅ 现有数据已更新

### ✅ 前端 (Frontend)

1. **UI更新**
   - ✅ Issues列表显示中文状态
   - ✅ 状态颜色优化
   - ✅ 新增启动按钮列

2. **StartIssueButton组件**
   - ✅ 根据状态显示不同按钮
   - ✅ 使用生成的API client
   - ✅ 错误处理和提示

3. **API Client**
   - ✅ 已重新生成
   - ✅ 包含startIssueTask和reportBranch方法

### ✅ Node服务 (Node Service)

1. **核心功能**
   - ✅ `/process-issue` 端点实现
   - ✅ Git操作(clone, branch, commit, push)
   - ✅ 自动上报结果
   - ✅ 命令执行支持

2. **部署文件**
   - ✅ Dockerfile
   - ✅ requirements.txt
   - ✅ README文档

## 🚀 快速开始

### 1. 启动主服务

```bash
# 确保数据库迁移已执行(已完成✅)
cd backend
alembic upgrade head  # 已经运行过了

# 启动服务
docker compose up -d
```

服务访问地址:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### 2. 启动Node服务

#### 方式A: 本地运行

```bash
cd node-service

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
export SERVER_URL=http://localhost:8000
export NODE_PORT=8007
export WORKSPACE_DIR=/tmp/workspace

# 启动
python main.py
```

#### 方式B: Docker运行

```bash
cd node-service

# 构建镜像
docker build -t ai-node-service .

# 运行
docker run -d \
  --name ai-node \
  --network host \
  -e SERVER_URL=http://localhost:8000 \
  -e NODE_PORT=8007 \
  -v $(pwd)/workspace:/workspace \
  ai-node-service

# 查看日志
docker logs -f ai-node
```

### 3. 注册Node到系统

1. 访问 http://localhost:5173
2. 登录系统(默认: admin@example.com / changethis)
3. 进入 **Nodes** 页面
4. 点击 **Add Node**
5. 填写信息:
   - Name: `AI Node 1`
   - IP: `localhost`
   - Description: `本地AI编码节点`
   - Status: `online`
6. 点击 **Add**

### 4. 添加GitHub凭证

1. 进入 **Credentials** 页面
2. 点击 **Add Credential**
3. 填写信息:
   - Name: `GitHub PAT`
   - Category: 选择类型
   - Token: 你的GitHub Personal Access Token
     (需要 `repo` 权限)
4. 关联到刚创建的Node

### 5. 创建测试Issue

1. 进入 **Issues** 页面
2. 点击 **Add Issue**
3. 填写信息:
   - Title: `测试自动化处理`
   - Description: `测试issue自动化功能`
   - Repository URL: `https://github.com/your-org/your-repo`
   - Issue Number: `1`
   - Priority: `1`
4. 点击 **Add**

### 6. 启动任务

1. 在Issues列表中找到刚创建的issue
2. 点击 **启动** 按钮
3. 观察状态变化:
   - 立即变为 **处理中**
   - 按钮变为 **运行中**(禁用)
4. 查看Node日志观察处理过程
5. 完成后状态变为 **待合入**

## 📊 状态流转图

```
待处理 (pending)
    ↓ [点击启动]
处理中 (processing)
    ↓ [Node成功完成]
待合入 (pending_merge)
    ↓ [手动合并PR]
已合入 (merged)

或者失败路径:
处理中 (processing)
    ↓ [Node失败]
已终止 (terminated)
    ↓ [点击重新启动]
处理中 (processing)
```

## 🔍 监控和调试

### 查看后端日志

```bash
# Docker环境
docker compose logs -f backend

# 查看特定服务
docker compose logs -f backend | grep -i "issue\|task"
```

### 查看Node日志

```bash
# Docker环境
docker logs -f ai-node

# 本地运行
# 日志直接输出到终端
```

### 查看数据库

```bash
# 连接PostgreSQL
docker exec -it ai-software-engineer-team-db-1 psql -U app -d app

# 查询issues
SELECT id, title, status, assigned_node_id FROM issue;

# 查询tasks
SELECT id, issue_id, node_id, status, result_branch FROM task;

# 退出
\q
```

### API测试

访问 http://localhost:8000/docs 使用Swagger UI测试:
- `/api/v1/issues/{id}/start` - 测试启动任务
- `/api/v1/issues/{id}` - 查看issue详情
- `/api/v1/issues/{id}/report-branch` - 手动上报结果

## 🛠️ 故障排查

### 问题1: 点击启动没反应

**检查项**:
```bash
# 1. 检查node是否在线
curl http://localhost:8007/health

# 2. 查看后端日志
docker compose logs backend | tail -50

# 3. 检查node是否有凭证
# 在UI中检查 Nodes -> 选择node -> 查看关联凭证
```

### 问题2: Node无法克隆仓库

**可能原因**:
- GitHub PAT权限不足
- 仓库URL错误
- 网络问题

**解决方法**:
```bash
# 测试凭证
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user

# 检查node日志
docker logs ai-node
```

### 问题3: 任务一直处于"处理中"

**可能原因**:
- Node服务崩溃
- Git操作失败但未上报

**解决方法**:
```bash
# 重启node服务
docker restart ai-node

# 或手动上报结果
curl -X POST "http://localhost:8000/api/v1/issues/{issue_id}/report-branch" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "task_id": "task-uuid",
    "branch_name": "ai/issue-1",
    "status": "failed",
    "error_message": "Manual intervention required"
  }'
```

## 📚 相关文档

- [功能实现详解](ISSUE_AUTOMATION_IMPLEMENTATION.md)
- [快速使用指南](ISSUE_AUTOMATION_QUICKSTART.md)
- [Node服务文档](node-service/README.md)

## 🎯 下一步

### 功能增强

1. **集成实际AI工具**
   - GitHub Copilot
   - Cursor
   - Claude Code

2. **添加WebSocket**
   - 实时进度更新
   - 日志流式输出

3. **任务队列**
   - 支持并发处理
   - 优先级调度

4. **代码审查**
   - 自动创建PR
   - AI代码审查

### 运维优化

1. **监控告警**
   - Prometheus metrics
   - Grafana dashboard
   - 告警通知

2. **日志聚合**
   - ELK/EFK stack
   - 集中式日志查询

3. **高可用**
   - Node负载均衡
   - 自动故障转移

## 🙏 总结

✅ **已完成的主要功能**:

1. ✅ Issue状态管理(5种状态)
2. ✅ 任务启动和分发
3. ✅ Node自动选择
4. ✅ Git自动化操作
5. ✅ 结果自动上报
6. ✅ 前端UI完整展示
7. ✅ 数据库迁移
8. ✅ API client生成
9. ✅ Node服务实现

🎉 **系统已经可以完整运行!**

只需:
1. 启动主服务 ✅
2. 启动Node服务 ✅
3. 配置Node和凭证 ✅
4. 创建issue并点击启动 ✅

即可体验完整的自动化流程!
