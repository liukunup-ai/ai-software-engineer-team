import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import Prompt, PromptCreate, PromptPublic, PromptsPublic, PromptUpdate, Message

router = APIRouter(prefix="/prompts", tags=["prompts"])


@router.get("/", response_model=PromptsPublic)
def read_prompts(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve prompts.
    """

    if current_user.is_superuser:
        count_statement = select(func.count()).select_from(Prompt)
        count = session.exec(count_statement).one()
        statement = select(Prompt).offset(skip).limit(limit)
        prompts = session.exec(statement).all()
    else:
        count_statement = (
            select(func.count())
            .select_from(Prompt)
            .where(Prompt.owner_id == current_user.id)
        )
        count = session.exec(count_statement).one()
        statement = (
            select(Prompt)
            .where(Prompt.owner_id == current_user.id)
            .offset(skip)
            .limit(limit)
        )
        prompts = session.exec(statement).all()

    return PromptsPublic(data=prompts, count=count)


@router.get("/{id}", response_model=PromptPublic)
def read_prompt(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get prompt by ID.
    """
    prompt = session.get(Prompt, id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    if not current_user.is_superuser and (prompt.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return prompt


@router.post("/", response_model=PromptPublic)
def create_prompt(
    *, session: SessionDep, current_user: CurrentUser, prompt_in: PromptCreate
) -> Any:
    """
    Create new prompt.
    """
    prompt = Prompt.model_validate(prompt_in, update={"owner_id": current_user.id})
    session.add(prompt)
    session.commit()
    session.refresh(prompt)
    return prompt


@router.put("/{id}", response_model=PromptPublic)
def update_prompt(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    prompt_in: PromptUpdate,
) -> Any:
    """
    Update a prompt.
    """
    prompt = session.get(Prompt, id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    if not current_user.is_superuser and (prompt.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    update_dict = prompt_in.model_dump(exclude_unset=True)
    prompt.sqlmodel_update(update_dict)
    session.add(prompt)
    session.commit()
    session.refresh(prompt)
    return prompt


@router.delete("/{id}")
def delete_prompt(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete a prompt.
    """
    prompt = session.get(Prompt, id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    if not current_user.is_superuser and (prompt.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    session.delete(prompt)
    session.commit()
    return Message(message="Prompt deleted successfully")