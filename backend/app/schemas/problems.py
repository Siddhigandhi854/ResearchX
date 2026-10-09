from datetime import datetime

from pydantic import BaseModel, Field, field_validator


def _clean_list(value: list[str] | None) -> list[str] | None:
    if value is None:
        return None
    cleaned = []
    for item in value:
        text = str(item).strip()
        if text and text not in cleaned:
            cleaned.append(text[:80])
        if len(cleaned) >= 20:
            break
    return cleaned


class ProblemCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    domain: str = Field(min_length=1, max_length=120)
    statement: str = Field(min_length=1, max_length=8000)
    desired_outcomes: list[str] = []
    technologies: list[str] = []

    @field_validator("desired_outcomes", "technologies", mode="before")
    @classmethod
    def lists(cls, value):
        return _clean_list(value) or []


class ProblemUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    domain: str | None = Field(default=None, min_length=1, max_length=120)
    statement: str | None = Field(default=None, min_length=1, max_length=8000)
    desired_outcomes: list[str] | None = None
    technologies: list[str] | None = None

    @field_validator("desired_outcomes", "technologies", mode="before")
    @classmethod
    def lists(cls, value):
        return _clean_list(value)


class ProblemCompany(BaseModel):
    user_id: str
    name: str = ""
    company_name: str = ""
    industry: str = ""


class ProblemResponse(BaseModel):
    id: str
    company: ProblemCompany
    title: str
    domain: str = ""
    statement: str = ""
    desired_outcomes: list[str] = []
    technologies: list[str] = []
    status: str
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ProblemListResponse(BaseModel):
    items: list[ProblemResponse]
    page: int
    limit: int
    total: int
