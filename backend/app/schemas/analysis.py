from datetime import datetime

from pydantic import BaseModel, Field


class ResearchAnalysis(BaseModel):
    title: str = ""
    research_problem: str = ""
    abstract: str = ""
    objectives: list[str] = Field(default_factory=list)
    methodology: str = ""
    technologies: list[str] = Field(default_factory=list)
    domain: str = ""
    keywords: list[str] = Field(default_factory=list)
    dataset: str = ""
    results: str = ""
    future_scope: str = ""
    innovation: str = ""
    research_stage: str = ""
    skills_required: list[str] = Field(default_factory=list)

    model_config = {"extra": "ignore"}


class AnalysisResponse(BaseModel):
    analysis_status: str
    analysis_error: str | None = None
    analyzed_at: datetime | None = None
    research_analysis: ResearchAnalysis | None = None
