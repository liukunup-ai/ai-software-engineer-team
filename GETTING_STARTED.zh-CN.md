# 快速开始指南

欢迎使用本项目！本指南将帮助你快速启动和运行项目。

## 环境要求
- Docker & Docker Compose
- Python 3.8+
- Node.js 16+

## 项目结构
- `backend/`：后端服务，基于 FastAPI
- `frontend/`：前端应用，基于 React + Vite
- `scripts/`：常用脚本

## 一键启动（推荐）

1. 安装 Docker 和 Docker Compose。
2. 在项目根目录运行：
   ```bash
   docker-compose up --build
   ```
3. 后端服务默认运行在 `http://localhost:8000`，前端运行在 `http://localhost:3000`

## 本地开发

### 后端
1. 进入 `backend/` 目录：
   ```bash
   cd backend
   ```
2. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```
3. 启动服务：
   ```bash
   uvicorn app.main:app --reload
   ```

### 前端
1. 进入 `frontend/` 目录：
   ```bash
   cd frontend
   ```
2. 安装依赖：
   ```bash
   npm install
   ```
3. 启动开发服务器：
   ```bash
   npm run dev
   ```

## 运行测试

- 后端测试：
  ```bash
  cd backend
  pytest
  ```
- 前端测试：
  ```bash
  cd frontend
  npm run test
  ```

## 常用脚本
- `scripts/` 目录下包含常用的构建、测试、部署脚本。

## 其他说明
- 更多详细信息请参考 `README.md`、`development.md` 和 `deployment.md`。

---
如有问题请提交 Issue 或联系维护者。