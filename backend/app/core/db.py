import uuid

from sqlmodel import Session, create_engine, select

from app import crud
from app.core.config import settings
from app.models import Project, ProjectRepositoryLink, Repository, User, UserCreate

engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))


DEMO_PROJECT_NAME = "AI Software Engineer"
DEMO_PROJECT_DESCRIPTION = "Preloaded demo project with canonical AI Software Engineer repositories."
DEMO_REPOSITORIES = [
    {
        "name": "ai-software-engineer",
        "url": "https://github.com/liukunup-ai/ai-software-engineer",
    },
    {
        "name": "ai-software-engineer-team",
        "url": "https://github.com/liukunup-ai/ai-software-engineer-team",
    },
]


# make sure all SQLModel models are imported (app.models) before initializing DB
# otherwise, SQLModel might fail to initialize relationships properly
# for more details: https://github.com/fastapi/full-stack-fastapi-template/issues/28


def init_db(session: Session) -> None:
    # Tables should be created with Alembic migrations
    # But if you don't want to use migrations, create
    # the tables un-commenting the next lines
    # from sqlmodel import SQLModel

    # This works because the models are already imported and registered from app.models
    # SQLModel.metadata.create_all(engine)

    # Create initial super user
    user = session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()
    if not user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
        )
        user = crud.create_user(session=session, user_create=user_in)

    # Create initial register key
    crud.ensure_register_key(session=session)

    ensure_demo_project(session=session, owner=user)


def ensure_demo_project(*, session: Session, owner: User | None) -> None:
    if owner is None:
        return

    project = session.exec(
        select(Project).where(
            Project.owner_id == owner.id,
            Project.name == DEMO_PROJECT_NAME,
        )
    ).first()

    if not project:
        project = Project(
            name=DEMO_PROJECT_NAME,
            description=DEMO_PROJECT_DESCRIPTION,
            owner_id=owner.id,
        )
        session.add(project)
        session.commit()
        session.refresh(project)

    ensure_demo_repositories(session=session, project=project, owner_id=owner.id)


def ensure_demo_repositories(
    *, session: Session, project: Project, owner_id: uuid.UUID
) -> None:
    changes_applied = False

    for repo_meta in DEMO_REPOSITORIES:
        repository = session.exec(
            select(Repository).where(Repository.url == repo_meta["url"])
        ).first()

        if not repository:
            repository = Repository(
                name=repo_meta["name"],
                url=repo_meta["url"],
                owner_id=owner_id,
            )
            session.add(repository)
            session.flush()
            changes_applied = True

        link_exists = session.exec(
            select(ProjectRepositoryLink).where(
                ProjectRepositoryLink.project_id == project.id,
                ProjectRepositoryLink.repository_id == repository.id,
            )
        ).first()

        if not link_exists:
            session.add(
                ProjectRepositoryLink(
                    project_id=project.id,
                    repository_id=repository.id,
                )
            )
            changes_applied = True

    if changes_applied:
        session.commit()
