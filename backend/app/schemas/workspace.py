from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, HttpUrl, TypeAdapter, ValidationError, field_validator

WorkspaceStatus = Literal["active", "completed", "archived"]
TaskStatus = Literal["todo", "in_progress", "completed"]
ResourceType = Literal["Paper", "Dataset", "GitHub", "Documentation", "Article", "Other"]


def _http_url(value: str) -> str:
    cleaned = str(value or "").strip()
    if not cleaned:
        raise ValueError("A URL is required")
    lowered = cleaned.lower()
    if not lowered.startswith("http://") and not lowered.startswith("https://"):
        raise ValueError("Only http(s) URLs are allowed")
    try:
        TypeAdapter(HttpUrl).validate_python(cleaned)
    except ValidationError:
        raise ValueError("Enter a valid http(s) URL")
    return cleaned


class WorkspacePerson(BaseModel):
    id: str
    name: str
    profile_image: str = ""
    role: str = "collaborator"


class WorkspaceProject(BaseModel):
    id: str | None = None
    title: str = ""
    domain: str = ""
    problem: str = ""
    objectives: list[str] = []
    methodology: str = ""
    technologies: list[str] = []


class WorkspaceListItem(BaseModel):
    id: str
    title: str
    domain: str = ""
    collaborator_count: int
    status: WorkspaceStatus
    updated_at: datetime | None = None


class WorkspaceActivityItem(BaseModel):
    id: str
    actor_name: str
    action: str
    description: str
    created_at: datetime | None = None


class WorkspaceSummary(BaseModel):
    active_workspaces: int = 0
    pending_tasks: int = 0
    completed_tasks: int = 0
    recent_activity: list[WorkspaceActivityItem] = []


class WorkspaceListResponse(BaseModel):
    items: list[WorkspaceListItem]
    summary: WorkspaceSummary


class WorkspaceDetail(BaseModel):
    id: str
    project: WorkspaceProject
    owner: WorkspacePerson
    members: list[WorkspacePerson]
    status: WorkspaceStatus
    created_at: datetime | None = None
    updated_at: datetime | None = None


class WorkspaceStatusUpdate(BaseModel):
    status: WorkspaceStatus


class NoteCreate(BaseModel):
    content: str = Field(min_length=1, max_length=5000)


class NoteUpdate(BaseModel):
    content: str = Field(min_length=1, max_length=5000)


class NoteResponse(BaseModel):
    id: str
    author: WorkspacePerson
    content: str
    created_at: datetime | None = None
    updated_at: datetime | None = None
    can_edit: bool = False


class NoteListResponse(BaseModel):
    items: list[NoteResponse]


class ResourceCreate(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    url: str
    description: str = Field(default="", max_length=1000)
    resource_type: ResourceType = "Other"

    @field_validator("url")
    @classmethod
    def validate_url(cls, value: str) -> str:
        return _http_url(value)


class ResourceResponse(BaseModel):
    id: str
    title: str
    url: str
    description: str = ""
    resource_type: str
    added_by: WorkspacePerson
    created_at: datetime | None = None
    can_delete: bool = False


class ResourceListResponse(BaseModel):
    items: list[ResourceResponse]


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    description: str = Field(default="", max_length=2000)
    assigned_to: str | None = None
    due_date: datetime | None = None

    @field_validator("assigned_to", mode="before")
    @classmethod
    def empty_assignee(cls, value):
        if value == "":
            return None
        return value


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=240)
    description: str | None = Field(default=None, max_length=2000)
    assigned_to: str | None = None
    status: TaskStatus | None = None
    due_date: datetime | None = None


class TaskResponse(BaseModel):
    id: str
    title: str
    description: str = ""
    assigned_to: WorkspacePerson | None = None
    created_by: WorkspacePerson
    status: TaskStatus
    due_date: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class TaskListResponse(BaseModel):
    items: list[TaskResponse]


class ActivityListResponse(BaseModel):
    items: list[WorkspaceActivityItem]
