from fastapi import APIRouter, Depends

from app.core.deps import require_role
from app.schemas.workspace import (
    ActivityListResponse,
    NoteCreate,
    NoteListResponse,
    NoteResponse,
    NoteUpdate,
    ResourceCreate,
    ResourceListResponse,
    ResourceResponse,
    TaskCreate,
    TaskListResponse,
    TaskResponse,
    TaskUpdate,
    WorkspaceDetail,
    WorkspaceListResponse,
    WorkspaceStatusUpdate,
)
from app.services import workspace_service

router = APIRouter(prefix="/workspaces", tags=["workspaces"])
authenticated = require_role("researcher", "corporate")


@router.get("", response_model=WorkspaceListResponse)
async def list_workspaces(current_user: dict = Depends(authenticated)):
    return await workspace_service.list_workspaces(current_user)


@router.get("/{workspace_id}", response_model=WorkspaceDetail)
async def get_workspace(workspace_id: str, current_user: dict = Depends(authenticated)):
    return await workspace_service.get_workspace(current_user, workspace_id)


@router.patch("/{workspace_id}/status", response_model=WorkspaceDetail)
async def update_status(
    workspace_id: str,
    payload: WorkspaceStatusUpdate,
    current_user: dict = Depends(authenticated),
):
    return await workspace_service.update_workspace_status(current_user, workspace_id, payload.status)


@router.get("/{workspace_id}/notes", response_model=NoteListResponse)
async def list_notes(workspace_id: str, current_user: dict = Depends(authenticated)):
    return await workspace_service.list_notes(current_user, workspace_id)


@router.post("/{workspace_id}/notes", response_model=NoteResponse)
async def create_note(workspace_id: str, payload: NoteCreate, current_user: dict = Depends(authenticated)):
    return await workspace_service.create_note(current_user, workspace_id, payload.content)


@router.put("/{workspace_id}/notes/{note_id}", response_model=NoteResponse)
async def update_note(
    workspace_id: str,
    note_id: str,
    payload: NoteUpdate,
    current_user: dict = Depends(authenticated),
):
    return await workspace_service.update_note(current_user, workspace_id, note_id, payload.content)


@router.delete("/{workspace_id}/notes/{note_id}")
async def delete_note(workspace_id: str, note_id: str, current_user: dict = Depends(authenticated)):
    return await workspace_service.delete_note(current_user, workspace_id, note_id)


@router.get("/{workspace_id}/resources", response_model=ResourceListResponse)
async def list_resources(workspace_id: str, current_user: dict = Depends(authenticated)):
    return await workspace_service.list_resources(current_user, workspace_id)


@router.post("/{workspace_id}/resources", response_model=ResourceResponse)
async def create_resource(
    workspace_id: str,
    payload: ResourceCreate,
    current_user: dict = Depends(authenticated),
):
    return await workspace_service.create_resource(current_user, workspace_id, payload)


@router.delete("/{workspace_id}/resources/{resource_id}")
async def delete_resource(workspace_id: str, resource_id: str, current_user: dict = Depends(authenticated)):
    return await workspace_service.delete_resource(current_user, workspace_id, resource_id)


@router.get("/{workspace_id}/tasks", response_model=TaskListResponse)
async def list_tasks(workspace_id: str, current_user: dict = Depends(authenticated)):
    return await workspace_service.list_tasks(current_user, workspace_id)


@router.post("/{workspace_id}/tasks", response_model=TaskResponse)
async def create_task(workspace_id: str, payload: TaskCreate, current_user: dict = Depends(authenticated)):
    return await workspace_service.create_task(current_user, workspace_id, payload)


@router.put("/{workspace_id}/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    workspace_id: str,
    task_id: str,
    payload: TaskUpdate,
    current_user: dict = Depends(authenticated),
):
    return await workspace_service.update_task(current_user, workspace_id, task_id, payload)


@router.delete("/{workspace_id}/tasks/{task_id}")
async def delete_task(workspace_id: str, task_id: str, current_user: dict = Depends(authenticated)):
    return await workspace_service.delete_task(current_user, workspace_id, task_id)


@router.get("/{workspace_id}/activity", response_model=ActivityListResponse)
async def list_activity(workspace_id: str, current_user: dict = Depends(authenticated)):
    return await workspace_service.list_activity(current_user, workspace_id)
