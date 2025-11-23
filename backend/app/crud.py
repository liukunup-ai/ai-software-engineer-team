import logging
import secrets
import uuid
from datetime import datetime
from typing import Any

from sqlmodel import Session, select

from app.core.config import settings
from app.core.security import get_password_hash, verify_password
from app.models import (
    Node,
    NodeCreate,
    NodeUpdate,
    RegisterKey,
    User,
    UserCreate,
    UserUpdate,
)
from app.models.issue import Issue, IssueCreate, IssueUpdate


logger = logging.getLogger(__name__)


def create_user(*, session: Session, user_create: UserCreate) -> User:
    now = datetime.utcnow()
    db_obj = User.model_validate(
        user_create,
        update={
            "hashed_password": get_password_hash(user_create.password),
            "created_at": now,
            "updated_at": now,
        },
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    extra_data["updated_at"] = datetime.utcnow()
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        return None
    if not verify_password(password, db_user.hashed_password):
        return None
    return db_user


def ensure_register_key(*, session: Session) -> RegisterKey | None:
    """Ensure there is exactly one persisted register key."""
    try:
        register_key = session.get(RegisterKey, 1)
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.warning("Could not query RegisterKey table yet: %s", exc)
        return None

    if not register_key:
        initial_value = settings.REGISTER_KEY or secrets.token_urlsafe(32)
        register_key = RegisterKey(key=initial_value)
        session.add(register_key)
        session.commit()
        session.refresh(register_key)
        logger.info("Persisted new node register key")
    elif settings.REGISTER_KEY != register_key.key:
        logger.info(
            "Detected different in-memory REGISTER_KEY; using persisted DB value"
        )

    return register_key

# Node CRUD helpers
def create_node(*, session: Session, node_in: NodeCreate) -> Node:
    now = datetime.utcnow()
    db_node = Node.model_validate(node_in, update={"created_at": now, "updated_at": now})
    session.add(db_node)
    session.commit()
    session.refresh(db_node)
    return db_node

def get_node(*, session: Session, node_id: uuid.UUID) -> Node | None:
    return session.get(Node, node_id)

def update_node(*, session: Session, db_node: Node, node_in: NodeUpdate) -> Node:
    node_data = node_in.model_dump(exclude_unset=True)
    node_data["updated_at"] = datetime.utcnow()
    db_node.sqlmodel_update(node_data)
    session.add(db_node)
    session.commit()
    session.refresh(db_node)
    return db_node

def delete_node(*, session: Session, node_id: uuid.UUID) -> None:
    db_node = session.get(Node, node_id)
    if db_node:
        session.delete(db_node)
        session.commit()

# Issue CRUD helpers
def create_issue(*, session: Session, issue_in: IssueCreate, owner_id: uuid.UUID) -> Issue:
    issue_data = issue_in.model_dump(exclude={"dependency_issue_ids"})
    now = datetime.utcnow()
    db_issue = Issue(
        **issue_data,
        owner_id=owner_id,
        created_at=now,
        updated_at=now,
    )
    session.add(db_issue)
    session.commit()
    session.refresh(db_issue)
    return db_issue

def get_issue(*, session: Session, issue_id: uuid.UUID) -> Issue | None:
    return session.get(Issue, issue_id)

def update_issue(*, session: Session, db_issue: Issue, issue_in: IssueUpdate) -> Issue:
    issue_data = issue_in.model_dump(exclude_unset=True, exclude={"dependency_issue_ids"})
    issue_data["updated_at"] = datetime.utcnow()
    db_issue.sqlmodel_update(issue_data)
    session.add(db_issue)
    session.commit()
    session.refresh(db_issue)
    return db_issue

def delete_issue(*, session: Session, issue_id: uuid.UUID) -> None:
    db_issue = session.get(Issue, issue_id)
    if db_issue:
        session.delete(db_issue)
        session.commit()
