"""
Node Service - AI Coding Agent

处理来自主服务器的issue任务，执行git操作和AI编码
"""
import os
import asyncio
import subprocess
from pathlib import Path
from typing import Optional
import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

# 配置
SERVER_URL = os.getenv("SERVER_URL", "http://localhost:8000")
NODE_PORT = int(os.getenv("NODE_PORT", "8007"))
WORKSPACE_DIR = os.getenv("WORKSPACE_DIR", "/workspace")

app = FastAPI(title="AI Coding Node Service")


# 数据模型
class ProcessIssueRequest(BaseModel):
    """处理Issue的请求模型"""
    issue_id: str
    task_id: str
    repository_url: str
    issue_number: int | None = None
    issue_title: str
    issue_description: str | None = None
    credential_token: str
    command: str | None = None


class CommandRequest(BaseModel):
    """执行命令的请求模型"""
    command: str
    args: list[str] | None = None


class CommandResult(BaseModel):
    """命令执行结果"""
    exit_code: int
    stdout: str
    stderr: str


class ReportBranchRequest(BaseModel):
    """上报分支的请求模型"""
    task_id: str
    branch_name: str
    status: str
    error_message: str | None = None


# 辅助函数
def run_command(command: str, args: list[str] | None = None, cwd: str | None = None) -> CommandResult:
    """
    执行shell命令
    
    Args:
        command: 命令
        args: 参数列表
        cwd: 工作目录
        
    Returns:
        CommandResult: 执行结果
    """
    if args is None:
        args = []
    
    full_command = [command] + args
    
    try:
        result = subprocess.run(
            full_command,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=300
        )
        
        return CommandResult(
            exit_code=result.returncode,
            stdout=result.stdout,
            stderr=result.stderr
        )
    except subprocess.TimeoutExpired:
        return CommandResult(
            exit_code=-1,
            stdout="",
            stderr="Command timeout after 300 seconds"
        )
    except Exception as e:
        return CommandResult(
            exit_code=-1,
            stdout="",
            stderr=str(e)
        )


async def report_result(issue_id: str, task_id: str, branch_name: str, status: str, error_message: str | None = None):
    """
    向服务端上报任务处理结果
    
    Args:
        issue_id: Issue ID
        task_id: Task ID
        branch_name: 分支名
        status: 状态 (success/failed)
        error_message: 错误信息
    """
    url = f"{SERVER_URL}/api/v1/issues/{issue_id}/report-branch"
    
    payload = {
        "task_id": task_id,
        "branch_name": branch_name,
        "status": status,
        "error_message": error_message
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            print(f"✅ Successfully reported result for task {task_id}")
    except Exception as e:
        print(f"❌ Failed to report result: {str(e)}")


async def process_issue_task(request: ProcessIssueRequest):
    """
    处理issue任务的主逻辑
    
    流程:
    1. 设置Git凭证
    2. 创建工作目录
    3. Clone仓库
    4. 创建新分支
    5. 执行AI coding (暂时跳过)
    6. Commit代码
    7. Push到远程
    8. 上报结果
    """
    issue_id = request.issue_id
    task_id = request.task_id
    repo_url = request.repository_url
    
    # 生成工作目录和分支名
    workspace = Path(WORKSPACE_DIR) / f"issue-{request.issue_number or issue_id}"
    branch_name = f"ai/issue-{request.issue_number}" if request.issue_number else f"ai/task-{task_id[:8]}"
    
    try:
        # 1. 设置Git凭证环境变量
        git_env = os.environ.copy()
        git_env["GIT_ASKPASS"] = "echo"
        git_env["GIT_USERNAME"] = "x-access-token"
        git_env["GIT_PASSWORD"] = request.credential_token
        
        # 2. 创建工作目录
        workspace.mkdir(parents=True, exist_ok=True)
        print(f"📁 Created workspace: {workspace}")
        
        # 3. Clone仓库
        print(f"📥 Cloning repository: {repo_url}")
        
        # 修改URL以包含token
        if repo_url.startswith("https://github.com/"):
            auth_url = repo_url.replace("https://", f"https://{request.credential_token}@")
        else:
            auth_url = repo_url
        
        clone_result = run_command("git", ["clone", auth_url, str(workspace)])
        
        if clone_result.exit_code != 0:
            raise Exception(f"Git clone failed: {clone_result.stderr}")
        
        print(f"✅ Repository cloned successfully")
        
        # 4. 创建并切换到新分支
        print(f"🌿 Creating branch: {branch_name}")
        branch_result = run_command("git", ["checkout", "-b", branch_name], cwd=str(workspace))
        
        if branch_result.exit_code != 0:
            raise Exception(f"Git branch creation failed: {branch_result.stderr}")
        
        print(f"✅ Branch created: {branch_name}")
        
        # 5. 执行AI coding (TODO: 集成实际的AI coding工具)
        # 这里暂时创建一个示例文件来模拟AI修改代码
        print(f"🤖 Running AI coding...")
        
        # 创建或修改README文件作为示例
        readme_path = workspace / "AI_CHANGES.md"
        readme_content = f"""# AI Generated Changes

## Issue Information
- Issue Number: {request.issue_number}
- Issue Title: {request.issue_title}
- Description: {request.issue_description}

## Changes Made
This file was automatically generated by the AI coding agent.

TODO: Integrate actual AI coding tool here (e.g., GitHub Copilot, Cursor, etc.)
"""
        readme_path.write_text(readme_content)
        
        print(f"✅ AI coding completed (demo mode)")
        
        # 6. Commit代码
        print(f"💾 Committing changes...")
        
        # Add all changes
        add_result = run_command("git", ["add", "."], cwd=str(workspace))
        if add_result.exit_code != 0:
            raise Exception(f"Git add failed: {add_result.stderr}")
        
        # Commit
        commit_message = f"AI: Fix issue #{request.issue_number} - {request.issue_title}" if request.issue_number else f"AI: Process task {task_id}"
        commit_result = run_command(
            "git", 
            ["commit", "-m", commit_message],
            cwd=str(workspace)
        )
        
        if commit_result.exit_code != 0:
            # 可能没有变更，这种情况也算成功
            if "nothing to commit" in commit_result.stdout:
                print("ℹ️  No changes to commit")
            else:
                raise Exception(f"Git commit failed: {commit_result.stderr}")
        
        print(f"✅ Changes committed")
        
        # 7. Push到远程
        print(f"📤 Pushing to remote...")
        push_result = run_command(
            "git",
            ["push", "-u", "origin", branch_name],
            cwd=str(workspace)
        )
        
        if push_result.exit_code != 0:
            raise Exception(f"Git push failed: {push_result.stderr}")
        
        print(f"✅ Pushed to remote: {branch_name}")
        
        # 8. 上报成功结果
        print(f"📡 Reporting success to server...")
        await report_result(
            issue_id=issue_id,
            task_id=task_id,
            branch_name=branch_name,
            status="success"
        )
        
        print(f"🎉 Task completed successfully!")
        
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Task failed: {error_msg}")
        
        # 上报失败结果
        await report_result(
            issue_id=issue_id,
            task_id=task_id,
            branch_name=branch_name if 'branch_name' in locals() else "",
            status="failed",
            error_message=error_msg
        )


# API端点
@app.post("/process-issue")
async def process_issue(request: ProcessIssueRequest):
    """
    接收并处理issue任务
    
    这个端点会立即返回，任务在后台异步处理
    """
    # 在后台启动任务处理
    asyncio.create_task(process_issue_task(request))
    
    return {
        "status": "accepted",
        "message": f"Task {request.task_id} accepted and processing started"
    }


@app.post("/execute")
async def execute_command(request: CommandRequest):
    """
    执行shell命令
    
    这是一个通用的命令执行端点，用于远程执行任何shell命令
    """
    result = run_command(request.command, request.args)
    
    if result.exit_code != 0:
        raise HTTPException(
            status_code=500,
            detail=f"Command failed with exit code {result.exit_code}: {result.stderr}"
        )
    
    return result


@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy", "service": "node"}


@app.get("/")
async def root():
    """根路径"""
    return {
        "service": "AI Coding Node Service",
        "version": "1.0.0",
        "endpoints": {
            "process_issue": "POST /process-issue",
            "execute": "POST /execute",
            "health": "GET /health"
        }
    }


if __name__ == "__main__":
    print(f"""
    🚀 AI Coding Node Service Starting...
    
    Server URL: {SERVER_URL}
    Node Port: {NODE_PORT}
    Workspace: {WORKSPACE_DIR}
    
    Ready to accept tasks!
    """)
    
    uvicorn.run(app, host="0.0.0.0", port=NODE_PORT)
