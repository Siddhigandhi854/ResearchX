from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class CollaborationCreate(BaseModel):
    receiver_id: str = Field(min_length=1)
    project_id: str | None = None
    problem_id: str | None = None
    message: str = Field(default="", max_length=1000)

    @field_validator("project_id", "problem_id", mode="before")
    @classmethod
    def empty_optional_id(cls, value):
        if value == "":
            return None
        return value


class CollaborationPerson(BaseModel):
    id: str
    name: str
    role: str = ""
    profile_image: str = ""
    domain: str = ""


class CollaborationProject(BaseModel):
    id: str
    title: str


class CollaborationProblem(BaseModel):
    id: str
    title: str
    domain: str = ""


class CollaborationRequestResponse(BaseModel):
    id: str
    sender: CollaborationPerson
    receiver: CollaborationPerson
    project: CollaborationProject | None = None
    problem: CollaborationProblem | None = None
    message: str = ""
    status: str
    created_at: datetime | None = None
    responded_at: datetime | None = None


class CollaborationListResponse(BaseModel):
    items: list[CollaborationRequestResponse]
