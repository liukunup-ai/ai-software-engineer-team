# 快速开始指南

## 环境要求

- Docker & Docker Compose
- Python 3.12
- Node.js 16+

## 一键启动

1. 在项目根目录运行

```bash
docker compose watch
```

2. 本地开发

```bash
# 前端命令
docker compose stop frontend
cd frontend
npm install
npm run dev
npm run test

# 后端命令
docker compose stop backend
cd backend
uv sync
. .venv/bin/activate
alembic upgrade head
fastapi dev app/main.py
fastapi run
pytest
```

3. URLs

Frontend: http://localhost:5173

Backend: http://localhost:8000

Automatic Interactive Docs (Swagger UI): http://localhost:8000/docs

Automatic Alternative Docs (ReDoc): http://localhost:8000/redoc

Adminer: http://localhost:8080

Traefik UI: http://localhost:8090

MailCatcher: http://localhost:1080

## 项目结构
- `backend/`：后端服务，基于 FastAPI，使用uv管理包
- `frontend/`：前端应用，基于 React + Vite
- `scripts/`：常用脚本



实现基于issue的自动化处理：
issue状态包括待处理（展示开始按钮）、处理中（展示运行中按钮）、待合入、已合入、终止（允许点击后再转到处理中）
1、issue列表上新增一个图标按钮，可以点击启动，启动后展示为运行中；
2、启动后创建一个任务到数据库作为订单记录，包括处理哪个issue，issue关联查询仓库列表，自动选择空闲中的node，node关联查询其可用凭证，下发此任务给node处理（通过http请求调用）；
3、先不考虑实现node处理过程；
3、node容器处理过程，接收到服务端命令后，设置凭证 pat 环境变量，认证检查，git clone 拉取 仓库列表 到工作目录下，根据下发命令创建特定分支，调用指定命令行进行ai coding，完成后git commit提交，git push推送代码
4、node节点处理完成，推送代码后，上报推送分支名
5、issue状态调整为待合入；


dashboard展示内容需要是当前登陆user所属的，超级管理员统计全部user的总和
issue 剩余数量/处理中/总数量
node 空闲/运行/离线/总数
project 总数
prompt 总数
credential 总数
repository 总数
task 列表（issue标题、节点名称、已经运行时间）
