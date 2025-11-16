"""
节点选择和负载均衡服务
智能选择最优节点处理任务
"""
import uuid
from typing import Optional
from datetime import datetime, timedelta
from sqlmodel import Session, select, func

from app.models.node import Node
from app.models.issue import Issue


class NodeSelectionService:
    """节点选择服务"""
    
    @staticmethod
    def get_available_nodes(session: Session) -> list[Node]:
        """获取所有在线且可用的节点"""
        statement = select(Node).where(Node.status == "online")
        nodes = session.exec(statement).all()
        return list(nodes)
    
    @staticmethod
    def get_node_workload(session: Session, node_id: uuid.UUID) -> int:
        """获取节点当前工作负载（正在处理的issue数量）"""
        statement = select(func.count()).select_from(Issue).where(
            Issue.assigned_node_id == node_id,
            Issue.status == "processing"
        )
        count = session.exec(statement).one()
        return count
    
    @staticmethod
    def is_node_healthy(node: Node, max_offline_minutes: int = 5) -> bool:
        """检查节点是否健康（最近心跳时间）"""
        if not node.last_heartbeat:
            return False
        
        threshold = datetime.utcnow() - timedelta(minutes=max_offline_minutes)
        return node.last_heartbeat > threshold
    
    @staticmethod
    def select_best_node(
        session: Session,
        required_tags: Optional[list[str]] = None
    ) -> Optional[Node]:
        """
        选择最优节点
        策略：
        1. 优先选择在线且健康的节点
        2. 考虑标签匹配（如果指定）
        3. 选择负载最低的节点
        """
        available_nodes = NodeSelectionService.get_available_nodes(session)
        
        if not available_nodes:
            return None
        
        # 过滤健康的节点
        healthy_nodes = [
            node for node in available_nodes 
            if NodeSelectionService.is_node_healthy(node)
        ]
        
        if not healthy_nodes:
            return None
        
        # 如果指定了标签,优先选择匹配的节点
        if required_tags:
            tagged_nodes = []
            for node in healthy_nodes:
                if node.tags:
                    node_tags = [tag.strip() for tag in node.tags.split(',')]
                    if any(tag in node_tags for tag in required_tags):
                        tagged_nodes.append(node)
            
            if tagged_nodes:
                healthy_nodes = tagged_nodes
        
        # 选择负载最低的节点
        node_loads = {}
        for node in healthy_nodes:
            workload = NodeSelectionService.get_node_workload(session, node.id)
            node_loads[node.id] = workload
        
        # 返回负载最小的节点
        best_node_id = min(node_loads, key=node_loads.get)
        return session.get(Node, best_node_id)
    
    @staticmethod
    def distribute_issues_to_nodes(
        session: Session,
        max_per_node: int = 5
    ) -> dict:
        """
        将待处理的issues分配到可用节点
        :param session: 数据库会话
        :param max_per_node: 每个节点最大同时处理数
        :return: 分配统计
        """
        stats = {
            'assigned': 0,
            'skipped': 0,
            'no_available_nodes': 0
        }
        
        # 获取待处理的issues（按优先级排序）
        statement = select(Issue).where(
            Issue.status == "pending"
        ).order_by(Issue.priority.desc(), Issue.created_at.asc())
        
        pending_issues = session.exec(statement).all()
        
        for issue in pending_issues:
            # 选择最优节点
            best_node = NodeSelectionService.select_best_node(session)
            
            if not best_node:
                stats['no_available_nodes'] += 1
                continue
            
            # 检查节点负载
            current_load = NodeSelectionService.get_node_workload(session, best_node.id)
            if current_load >= max_per_node:
                stats['skipped'] += 1
                continue
            
            # 分配issue到节点
            issue.assigned_node_id = best_node.id
            session.add(issue)
            stats['assigned'] += 1
        
        session.commit()
        return stats
