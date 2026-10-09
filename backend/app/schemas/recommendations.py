from pydantic import BaseModel, Field


class MatchedProject(BaseModel):
    project_id: str
    title: str
    similarity_score: int


class ProjectRecommendation(BaseModel):
    project_id: str
    researcher_id: str = ""
    title: str
    domain: str = ""
    similarity_score: int
    matched_fields: list[str] = []
    matched_skills: list[str] = []
    matched_technologies: list[str] = []
    reason: str = ""


class ResearcherRecommendation(BaseModel):
    user_id: str
    name: str
    profile_image: str = ""
    domain: str = ""
    similarity_score: int
    matched_projects: list[MatchedProject] = []
    matched_skills: list[str] = []
    reason: str = ""


class ProjectRecommendationResponse(BaseModel):
    project_id: str
    recommendations: list[ProjectRecommendation]
    message: str | None = None


class ResearcherRecommendationResponse(BaseModel):
    project_id: str
    recommendations: list[ResearcherRecommendation]
    message: str | None = None


class RecommendationQuery(BaseModel):
    limit: int = Field(default=5, ge=1, le=20)
