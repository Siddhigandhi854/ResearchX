from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, HttpUrl, TypeAdapter, ValidationError, field_validator


def _clean_list(value: list[str] | None) -> list[str] | None:
    if value is None:
        return None
    return [item.strip() for item in value if item and str(item).strip()]


def _clean_url(value: str | None) -> str:
    if value is None:
        return ""
    cleaned = str(value).strip()
    if not cleaned:
        return ""
    try:
        TypeAdapter(HttpUrl).validate_python(cleaned)
    except ValidationError:
        raise ValueError("Enter a valid http(s) URL")
    return cleaned


class ResearcherProfileUpdate(BaseModel):
    university: str | None = Field(default=None, max_length=200)
    institution: str | None = Field(default=None, max_length=200)
    department: str | None = Field(default=None, max_length=200)
    research_interests: list[str] | None = None
    skills: list[str] | None = None
    technologies: list[str] | None = None
    research_domains: list[str] | None = None
    bio: str | None = Field(default=None, max_length=2000)
    publications: list[str] | None = None
    patents: list[str] | None = None
    profile_image: str | None = Field(default=None, max_length=500)
    portfolio_url: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    visibility: Literal["public", "private"] | None = None

    @field_validator("research_interests", "skills", "technologies", "research_domains", "publications", "patents")
    @classmethod
    def clean_lists(cls, value: list[str] | None) -> list[str] | None:
        return _clean_list(value)

    @field_validator("portfolio_url", "linkedin_url", "github_url", "profile_image")
    @classmethod
    def validate_url(cls, value: str | None) -> str | None:
        if value is None:
            return value
        return _clean_url(value)


class PublicProjectSummary(BaseModel):
    id: str
    title: str
    domain: str = ""
    description: str = ""
    technologies: list[str] = []
    research_stage: str = ""


class ResearcherProfileResponse(BaseModel):
    id: str
    user_id: str
    name: str = ""
    university: str = ""
    institution: str = ""
    department: str = ""
    research_interests: list[str] = []
    skills: list[str] = []
    technologies: list[str] = []
    research_domains: list[str] = []
    bio: str = ""
    publications: list[str] = []
    patents: list[str] = []
    profile_image: str = ""
    portfolio_url: str = ""
    linkedin_url: str = ""
    github_url: str = ""
    visibility: Literal["public", "private"] = "public"
    created_at: datetime | None = None
    updated_at: datetime | None = None


class PublicResearcherProfile(BaseModel):
    user_id: str
    name: str
    bio: str = ""
    institution: str = ""
    department: str = ""
    research_interests: list[str] = []
    skills: list[str] = []
    technologies: list[str] = []
    research_domains: list[str] = []
    profile_image: str = ""
    portfolio_url: str = ""
    linkedin_url: str = ""
    github_url: str = ""
    projects: list[PublicProjectSummary] = []


class PublicResearcherListItem(BaseModel):
    user_id: str
    name: str
    institution: str = ""
    department: str = ""
    research_domains: list[str] = []
    profile_image: str = ""


class PublicResearcherListResponse(BaseModel):
    items: list[PublicResearcherListItem]
    page: int
    limit: int
    total: int
