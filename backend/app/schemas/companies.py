from datetime import datetime

from pydantic import BaseModel, Field


class CompanyProfileUpdate(BaseModel):
    company_name: str | None = Field(default=None, max_length=200)
    industry: str | None = Field(default=None, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    website: str | None = Field(default=None, max_length=300)
    location: str | None = Field(default=None, max_length=200)
    requirements: list[str] | None = None


class CompanyProfileResponse(BaseModel):
    id: str
    user_id: str
    company_name: str = ""
    industry: str = ""
    description: str = ""
    website: str = ""
    location: str = ""
    requirements: list[str] = []
    created_at: datetime | None = None
    updated_at: datetime | None = None
