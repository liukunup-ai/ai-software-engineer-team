"""
GitHub Issue同步服务
自动从GitHub仓库拉取issues并同步到本地数据库
"""
import httpx
import uuid
from typing import Optional, List
from datetime import datetime
from sqlmodel import Session, select

from app.models.issue import Issue, IssueCreate
from app.core.config import settings


class GitHubSyncService:
    """GitHub同步服务"""
    
    def __init__(self, github_token: Optional[str] = None):
        """
        初始化GitHub同步服务
        :param github_token: GitHub Personal Access Token
        """
        self.github_token = github_token or getattr(settings, 'GITHUB_TOKEN', None)
        self.headers = {}
        if self.github_token:
            self.headers['Authorization'] = f'token {self.github_token}'
        self.headers['Accept'] = 'application/vnd.github.v3+json'
    
    async def fetch_issues_from_repo(
        self, 
        repo_owner: str, 
        repo_name: str,
        state: str = "open",
        labels: Optional[List[str]] = None,
        since: Optional[datetime] = None
    ) -> List[dict]:
        """
        从GitHub仓库获取issues
        :param repo_owner: 仓库所有者
        :param repo_name: 仓库名称
        :param state: issue状态 (open/closed/all)
        :param labels: 标签过滤
        :param since: 只获取此时间之后更新的issues
        """
        url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/issues"
        params = {
            "state": state,
            "per_page": 100,
            "sort": "updated",
            "direction": "desc"
        }
        
        if labels:
            params['labels'] = ','.join(labels)
        
        if since:
            params['since'] = since.isoformat()
        
        all_issues = []
        page = 1
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            while True:
                params['page'] = page
                response = await client.get(url, headers=self.headers, params=params)
                response.raise_for_status()
                
                issues = response.json()
                if not issues:
                    break
                
                # 过滤掉pull requests (GitHub API会把PR也当作issue返回)
                issues = [issue for issue in issues if 'pull_request' not in issue]
                all_issues.extend(issues)
                
                # 如果返回的issues少于per_page,说明已经是最后一页
                if len(issues) < params['per_page']:
                    break
                
                page += 1
        
        return all_issues
    
    async def sync_issues_to_db(
        self,
        session: Session,
        owner_id: uuid.UUID,
        repo_owner: str,
        repo_name: str,
        labels: Optional[List[str]] = None,
        priority_mapping: Optional[dict] = None
    ) -> dict:
        """
        同步GitHub issues到数据库
        :param session: 数据库会话
        :param owner_id: Issue拥有者ID
        :param repo_owner: GitHub仓库所有者
        :param repo_name: GitHub仓库名称
        :param labels: 要同步的标签过滤
        :param priority_mapping: 标签到优先级的映射
        :return: 同步结果统计
        """
        if priority_mapping is None:
            priority_mapping = {
                'critical': 100,
                'high': 75,
                'medium': 50,
                'low': 25,
                'enhancement': 10,
                'bug': 60,
            }
        
        repo_url = f"https://github.com/{repo_owner}/{repo_name}"
        
        # 获取GitHub issues
        github_issues = await self.fetch_issues_from_repo(
            repo_owner, repo_name, labels=labels
        )
        
        stats = {
            'fetched': len(github_issues),
            'created': 0,
            'updated': 0,
            'skipped': 0
        }
        
        for gh_issue in github_issues:
            issue_number = gh_issue['number']
            
            # 检查是否已存在
            statement = select(Issue).where(
                Issue.repository_url == repo_url,
                Issue.issue_number == issue_number
            )
            existing_issue = session.exec(statement).first()
            
            # 计算优先级
            priority = 0
            for label in gh_issue.get('labels', []):
                label_name = label['name'].lower()
                if label_name in priority_mapping:
                    priority = max(priority, priority_mapping[label_name])
            
            if existing_issue:
                # 更新现有issue
                if existing_issue.status in ['completed', 'failed']:
                    # 已完成或失败的issue不再更新
                    stats['skipped'] += 1
                    continue
                
                existing_issue.title = gh_issue['title']
                existing_issue.content = gh_issue.get('body', '')
                existing_issue.priority = priority
                existing_issue.updated_at = datetime.utcnow()
                session.add(existing_issue)
                stats['updated'] += 1
            else:
                # 创建新issue
                new_issue = Issue(
                    owner_id=owner_id,
                    title=gh_issue['title'],
                    content=gh_issue.get('body', ''),
                    repository_url=repo_url,
                    issue_number=issue_number,
                    priority=priority,
                    status='pending'
                )
                session.add(new_issue)
                stats['created'] += 1
        
        session.commit()
        return stats
    
    async def sync_multiple_repos(
        self,
        session: Session,
        owner_id: uuid.UUID,
        repos: List[dict]
    ) -> dict:
        """
        同步多个仓库的issues
        :param session: 数据库会话
        :param owner_id: Issue拥有者ID
        :param repos: 仓库列表，每个元素包含 {owner, name, labels}
        :return: 总的同步统计
        """
        total_stats = {
            'repos': len(repos),
            'total_fetched': 0,
            'total_created': 0,
            'total_updated': 0,
            'total_skipped': 0,
            'repo_details': []
        }
        
        for repo in repos:
            repo_owner = repo['owner']
            repo_name = repo['name']
            labels = repo.get('labels')
            
            try:
                stats = await self.sync_issues_to_db(
                    session, owner_id, repo_owner, repo_name, labels
                )
                total_stats['total_fetched'] += stats['fetched']
                total_stats['total_created'] += stats['created']
                total_stats['total_updated'] += stats['updated']
                total_stats['total_skipped'] += stats['skipped']
                total_stats['repo_details'].append({
                    'repo': f"{repo_owner}/{repo_name}",
                    'stats': stats
                })
            except Exception as e:
                total_stats['repo_details'].append({
                    'repo': f"{repo_owner}/{repo_name}",
                    'error': str(e)
                })
        
        return total_stats
