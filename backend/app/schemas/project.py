from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, HttpUrl, TypeAdapter, ValidationError, field_validator

from app.schemas.analysis import ResearchAnalysis

ProjectStatus = Literal["draft", "published", "archived"]
PrototypeStatus = Literal[
    "Research",
    "Concept",
    "Proof of Concept",
    "Prototype",
    "Pilot",
    "Industry Ready",
]
Visibility = Literal["public", "private"]
AiAnalysisStatus = Literal["not_analyzed", "pending", "processing", "completed", "complete", "failed"]


def _normalize_url(value: str | None) -> str:
    if value is None:
        return ""
    cleaned = str(value).strip()
    return cleaned


class ProjectCreate(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    problem_statement: str = Field(min_length=1, max_length=8000)
    proposed_solution: str = Field(min_length=1, max_length=8000)
    research_domain: str = Field(min_length=1, max_length=200)
    technologies: list[str] = []
    methodology: str = Field(default="", max_length=8000)
    results: str = Field(default="", max_length=8000)
    prototype_status: PrototypeStatus = "Research"
    industry_applications: list[str] = []
    github_url: str = ""
    demo_url: str = ""
    research_interests: list[str] = []

    @field_validator("technologies", "industry_applications", "research_interests")
    @classmethod
    def clean_lists(cls, value: list[str]) -> list[str]:
        return [item.strip() for item in value if item and item.strip()]

    @field_validator("github_url", "demo_url")
    @classmethod
    def validate_url(cls, value: str) -> str:
        cleaned = _normalize_url(value)
        if not cleaned:
            return ""
        try:
            TypeAdapter(HttpUrl).validate_python(cleaned)
        except ValidationError:
            raise ValueError("Enter a valid http(s) URL")
        return cleaned


class ProjectUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=240)
    problem_statement: str | None = Field(default=None, min_length=1, max_length=8000)
    proposed_solution: str | None = Field(default=None, min_length=1, max_length=8000)
    research_domain: str | None = Field(default=None, min_length=1, max_length=200)
    technologies: list[str] | None = None
    methodology: str | None = Field(default=None, max_length=8000)
    results: str | None = Field(default=None, max_length=8000)
    prototype_status: PrototypeStatus | None = None
    industry_applications: list[str] | None = None
    github_url: str | None = None
    demo_url: str | None = None
    research_interests: list[str] | None = None
    status: ProjectStatus | None = None
    visibility: Visibility | None = None

    @field_validator("technologies", "industry_applications", "research_interests")
    @classmethod
    def clean_lists(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return value
        return [item.strip() for item in value if item and item.strip()]

    @field_validator("github_url", "demo_url")
    @classmethod
    def validate_url(cls, value: str | None) -> str | None:
        if value is None:
            return value
        cleaned = _normalize_url(value)
        if not cleaned:
            return ""
        try:
            TypeAdapter(HttpUrl).validate_python(cleaned)
        except ValidationError:
            raise ValueError("Enter a valid http(s) URL")
        return cleaned


class ProjectResponse(BaseModel):
    id: str
    researcher_id: str
    researcher_name: str | None = None
    title: str
    problem_statement: str
    proposed_solution: str
    research_domain: str
    technologies: list[str] = []
    methodology: str = ""
    results: str = ""
    prototype_status: PrototypeStatus
    industry_applications: list[str] = []
    github_url: str = ""
    demo_url: str = ""
    research_interests: list[str] = []
    status: ProjectStatus
    visibility: Visibility
    ai_analysis_status: AiAnalysisStatus = "pending"
    analysis_status: str = "pending"
    analysis_error: str | None = None
    analyzed_at: datetime | None = None
    research_analysis: ResearchAnalysis | None = None
    ai_summary: str | None = None
    has_paper: bool = False
    paper_filename: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ProjectListItem(BaseModel):
    id: str
    title: str
    research_domain: str
    technologies: list[str] = []
    prototype_status: PrototypeStatus
    status: ProjectStatus
    has_paper: bool = False
    paper_filename: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ProjectListResponse(BaseModel):
    items: list[ProjectListItem]
    page: int
    limit: int
    total: int
