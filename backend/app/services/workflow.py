"""
工作流服务: 处理Issue的自动化工作流
包括: 一键初始化、拉取Issue、自动处理、提交推送
"""
import uuid
import httpx
from datetime import datetime
from typing import Optional

from sqlmodel import Session, select
from app.models.issue import Issue
from app.models.node import Node
from app.models.command import CommandRequest, CommandResult


class WorkflowService:
    """工作流服务类"""
    
    @staticmethod
    def _get_workspace_path(issue_id: uuid.UUID) -> str:
        """获取工作空间路径"""
        return f"/workspace/issue-{issue_id}"
    
    @staticmethod
    async def execute_command_on_node(
        node: Node, 
        command: str, 
        args: list[str] | None = None,
        working_dir: str | None = None
    ) -> CommandResult:
        """
        在指定节点上执行命令
        :param node: 节点对象
        :param command: 命令
        :param args: 命令参数
        :param working_dir: 工作目录
        """
        if args is None:
            args = []
        
        node_url = f"http://{node.ip}:8007/execute"
        
        # 如果指定了工作目录,将命令包装在shell中执行
        if working_dir:
            # 使用shell命令包装,确保工作目录有效
            shell_cmd = f"cd {working_dir} && {command} {' '.join(args)}"
            cmd_request = CommandRequest(command="bash", args=["-c", shell_cmd])
        else:
            cmd_request = CommandRequest(command=command, args=args)
        
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                node_url,
                json=cmd_request.model_dump()
            )
            response.raise_for_status()
            return CommandResult(**response.json())
    
    @staticmethod
    async def init_repository(
        session: Session,
        node_id: uuid.UUID,
        issue_id: uuid.UUID,
        repo_url: str,
        branch_name: str = "main"
    ) -> dict:
        """
        一键初始化: git clone下载代码,创建本地分支
        """
        node = session.get(Node, node_id)
        if not node:
            raise ValueError(f"Node {node_id} not found")
        
        if node.status != "online":
            raise ValueError(f"Node {node_id} is not online")
        
        workspace = WorkflowService._get_workspace_path(issue_id)
        results = {}
        
        # 1. 创建工作空间目录
        mkdir_result = await WorkflowService.execute_command_on_node(
            node, "mkdir", ["-p", workspace]
        )
        results["mkdir"] = mkdir_result
        
        # 2. Clone仓库到工作空间
        clone_result = await WorkflowService.execute_command_on_node(
            node, 
            "git", 
            ["clone", repo_url, "."],
            working_dir=workspace
        )
        results["clone"] = clone_result
        
        # 3. 创建并切换到新分支
        branch_result = await WorkflowService.execute_command_on_node(
            node,
            "git",
            ["checkout", "-b", branch_name],
            working_dir=workspace
        )
        results["create_branch"] = branch_result
        
        return results
    
    @staticmethod
    async def process_issue(
        session: Session,
        issue_id: uuid.UUID,
        node_id: uuid.UUID
    ) -> dict:
        """
        自动处理Issue:
        1. 拉取一个Issue
        2. 拼接成ai coding命令
        3. 在本地分支上解决问题并测试
        """
        issue = session.get(Issue, issue_id)
        if not issue:
            raise ValueError(f"Issue {issue_id} not found")
        
        node = session.get(Node, node_id)
        if not node:
            raise ValueError(f"Node {node_id} not found")
        
        # 更新Issue状态
        issue.status = "processing"
        issue.assigned_node_id = node_id
        issue.started_at = datetime.utcnow()
        session.add(issue)
        session.commit()
        
        results = {}
        workspace = WorkflowService._get_workspace_path(issue_id)
        
        try:
            # 构造分支名
            branch_name = f"fix-issue-{issue.issue_number or issue_id}"
            
            # 1. 初始化仓库
            if issue.repository_url:
                init_results = await WorkflowService.init_repository(
                    session, node_id, issue_id, issue.repository_url, branch_name
                )
                results["init"] = init_results
            
            # 2. 构造AI Coding命令
            ai_prompt = f"Fix Issue #{issue.issue_number}: {issue.title}\n\nDescription:\n{issue.description or 'No description provided'}\n\nPlease analyze the issue, implement the fix, and ensure all tests pass."
            
            # 执行AI Coding CLI命令 (假设命令为 qoder)
            coding_result = await WorkflowService.execute_command_on_node(
                node,
                "qoder",
                ["--prompt", ai_prompt, "--auto-test"],
                working_dir=workspace
            )
            results["ai_coding"] = coding_result
            
            # 更新成功状态
            issue.status = "completed"
            issue.completed_at = datetime.utcnow()
            issue.result_branch = branch_name
            
        except Exception as e:
            # 更新失败状态
            issue.status = "failed"
            issue.error_message = str(e)
            results["error"] = str(e)
        
        session.add(issue)
        session.commit()
        
        return results
    
    @staticmethod
    async def commit_and_push(
        session: Session,
        issue_id: uuid.UUID,
        commit_message: Optional[str] = None
    ) -> dict:
        """
        提交并推送代码
        """
        issue = session.get(Issue, issue_id)
        if not issue:
            raise ValueError(f"Issue {issue_id} not found")
        
        if not issue.assigned_node_id:
            raise ValueError(f"Issue {issue_id} has no assigned node")
        
        node = session.get(Node, issue.assigned_node_id)
        if not node:
            raise ValueError(f"Node {issue.assigned_node_id} not found")
        
        workspace = WorkflowService._get_workspace_path(issue_id)
        results = {}
        
        # 默认提交信息
        if not commit_message:
            commit_message = f"Fix issue #{issue.issue_number}: {issue.title}"
        
        # 1. Git add
        add_result = await WorkflowService.execute_command_on_node(
            node,
            "git",
            ["add", "."],
            working_dir=workspace
        )
        results["add"] = add_result
        
        # 2. Git commit
        commit_result = await WorkflowService.execute_command_on_node(
            node,
            "git",
            ["commit", "-m", commit_message],
            working_dir=workspace
        )
        results["commit"] = commit_result
        
        # 3. Git push
        push_result = await WorkflowService.execute_command_on_node(
            node,
            "git",
            ["push", "origin", issue.result_branch or "main"],
            working_dir=workspace
        )
        results["push"] = push_result
        
        return results
    
    @staticmethod
    async def auto_process_workflow(
        session: Session,
        issue_id: uuid.UUID,
        node_id: uuid.UUID
    ) -> dict:
        """
        完整自动化工作流: 初始化 -> 处理Issue -> 提交推送
        """
        results = {}
        
        # 1. 处理Issue
        process_results = await WorkflowService.process_issue(session, issue_id, node_id)
        results["process"] = process_results
        
        # 2. 如果处理成功,自动提交推送
        issue = session.get(Issue, issue_id)
        if issue and issue.status == "completed":
            push_results = await WorkflowService.commit_and_push(session, issue_id)
            results["push"] = push_results
        
        return results
