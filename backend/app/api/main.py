from fastapi import APIRouter

from app.api.routes import items, login, private, users, utils, nodes, issues, credentials, repositories, prompts, projects
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)

api_router.include_router(items.router)
api_router.include_router(nodes.router)
api_router.include_router(issues.router)
api_router.include_router(credentials.router)
api_router.include_router(repositories.router)
api_router.include_router(prompts.router)
api_router.include_router(projects.router)


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
