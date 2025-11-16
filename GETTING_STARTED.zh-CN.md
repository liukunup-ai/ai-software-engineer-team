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
