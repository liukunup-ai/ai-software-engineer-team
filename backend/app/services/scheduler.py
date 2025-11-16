"""
定时任务调度服务
自动化批量处理issues
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional
from sqlmodel import Session, create_engine, select

from app.core.config import settings
from app.core.db import engine
from app.models.issue import Issue
from app.services.workflow import WorkflowService
from app.services.node_selection import NodeSelectionService
from app.services.github_sync import GitHubSyncService

logger = logging.getLogger(__name__)


class SchedulerService:
    """调度服务"""
    
    def __init__(self):
        self.running = False
        self.tasks = []
    
    async def sync_github_repos_task(
        self,
        repos: list[dict],
        owner_id: str,
        interval_hours: int = 1
    ):
        """定时同步GitHub仓库的issues"""
        while self.running:
            try:
                with Session(engine) as session:
                    github_service = GitHubSyncService()
                    stats = await github_service.sync_multiple_repos(
                        session=session,
                        owner_id=owner_id,
                        repos=repos
                    )
                    logger.info(f"GitHub sync completed: {stats}")
            except Exception as e:
                logger.error(f"GitHub sync failed: {str(e)}")
            
            # 等待指定间隔
            await asyncio.sleep(interval_hours * 3600)
    
    async def auto_process_pending_issues_task(
        self,
        interval_minutes: int = 30,
        max_per_batch: int = 10
    ):
        """定时自动处理待处理的issues"""
        while self.running:
            try:
                with Session(engine) as session:
                    # 1. 分配issues到节点
                    distribute_stats = NodeSelectionService.distribute_issues_to_nodes(
                        session, max_per_node=5
                    )
                    logger.info(f"Issue distribution: {distribute_stats}")
                    
                    # 2. 获取已分配但未开始的issues
                    statement = select(Issue).where(
                        Issue.status == "pending",
                        Issue.assigned_node_id.isnot(None)
                    ).limit(max_per_batch)
                    
                    issues_to_process = session.exec(statement).all()
                    
                    # 3. 批量处理issues
                    for issue in issues_to_process:
                        try:
                            await WorkflowService.auto_process_workflow(
                                session,
                                issue.id,
                                issue.assigned_node_id
                            )
                            logger.info(f"Issue {issue.id} processed successfully")
                        except Exception as e:
                            logger.error(f"Failed to process issue {issue.id}: {str(e)}")
                
            except Exception as e:
                logger.error(f"Auto process task failed: {str(e)}")
            
            # 等待指定间隔
            await asyncio.sleep(interval_minutes * 60)
    
    async def cleanup_old_workspaces_task(
        self,
        interval_hours: int = 24,
        max_age_days: int = 7
    ):
        """定时清理旧的工作空间"""
        while self.running:
            try:
                with Session(engine) as session:
                    # 获取已完成且超过指定天数的issues
                    threshold = datetime.utcnow() - timedelta(days=max_age_days)
                    statement = select(Issue).where(
                        Issue.status.in_(["completed", "failed"]),
                        Issue.completed_at < threshold
                    )
                    
                    old_issues = session.exec(statement).all()
                    
                    for issue in old_issues:
                        if issue.assigned_node_id:
                            # 这里可以调用节点API清理工作空间
                            logger.info(f"Should cleanup workspace for issue {issue.id}")
                
            except Exception as e:
                logger.error(f"Cleanup task failed: {str(e)}")
            
            await asyncio.sleep(interval_hours * 3600)
    
    def start(
        self,
        sync_repos: Optional[list[dict]] = None,
        sync_owner_id: Optional[str] = None,
        enable_auto_process: bool = True,
        enable_cleanup: bool = True
    ):
        """启动调度器"""
        self.running = True
        
        # GitHub同步任务
        if sync_repos and sync_owner_id:
            task = asyncio.create_task(
                self.sync_github_repos_task(sync_repos, sync_owner_id)
            )
            self.tasks.append(task)
        
        # 自动处理任务
        if enable_auto_process:
            task = asyncio.create_task(
                self.auto_process_pending_issues_task()
            )
            self.tasks.append(task)
        
        # 清理任务
        if enable_cleanup:
            task = asyncio.create_task(
                self.cleanup_old_workspaces_task()
            )
            self.tasks.append(task)
        
        logger.info("Scheduler started")
    
    def stop(self):
        """停止调度器"""
        self.running = False
        for task in self.tasks:
            task.cancel()
        self.tasks.clear()
        logger.info("Scheduler stopped")


# 全局调度器实例
scheduler = SchedulerService()
