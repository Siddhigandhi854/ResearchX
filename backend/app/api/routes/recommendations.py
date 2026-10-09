from fastapi import APIRouter, Depends, Query

from app.core.deps import require_role
from app.schemas.recommendations import ProjectRecommendationResponse, ResearcherRecommendationResponse
from app.services import recommendation_service

router = APIRouter(prefix="/recommendations", tags=["recommendations"])
researcher_only = require_role("researcher")


@router.get("/projects/{project_id}", response_model=ProjectRecommendationResponse)
async def recommend_projects(
    project_id: str,
    limit: int = Query(default=5, ge=1, le=20),
    current_user: dict = Depends(researcher_only),
):
    return await recommendation_service.get_project_recommendations(current_user, project_id, limit)


@router.get("/researchers/{project_id}", response_model=ResearcherRecommendationResponse)
async def recommend_researchers(
    project_id: str,
    limit: int = Query(default=5, ge=1, le=20),
    current_user: dict = Depends(researcher_only),
):
    return await recommendation_service.get_researcher_recommendations(current_user, project_id, limit)
