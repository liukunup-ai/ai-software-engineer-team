FROM python:3.12-slim

WORKDIR /app

# 安装git和其他必要工具
RUN apt-get update && \
    apt-get install -y git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY main.py .

# 创建工作目录
RUN mkdir -p /workspace

# 设置环境变量
ENV SERVER_URL=http://backend:8000
ENV NODE_PORT=8007
ENV WORKSPACE_DIR=/workspace

# 暴露端口
EXPOSE 8007

# 启动服务
CMD ["python", "main.py"]
