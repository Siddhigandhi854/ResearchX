from fastapi import APIRouter, Depends, Query

from app.core.deps import require_role
from app.schemas.researchers import (
    PublicResearcherListResponse,
    PublicResearcherProfile,
    ResearcherProfileResponse,
    ResearcherProfileUpdate,
)
from app.services import researcher_service

router = APIRouter(prefix="/researchers", tags=["researchers"])
researcher_only = require_role("researcher")
authenticated = require_role("researcher", "corporate")


@router.get("/me", response_model=ResearcherProfileResponse)
async def get_my_profile(current_user: dict = Depends(researcher_only)):
    return await researcher_service.get_researcher_profile(current_user)


@router.put("/me", response_model=ResearcherProfileResponse)
async def update_my_profile(
    payload: ResearcherProfileUpdate,
    current_user: dict = Depends(researcher_only),
):
    return await researcher_service.update_researcher_profile(current_user, payload)


@router.get("", response_model=PublicResearcherListResponse)
async def list_researchers(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=12, ge=1, le=50),
    domain: str | None = Query(default=None, max_length=120),
    current_user: dict = Depends(authenticated),
):
    return await researcher_service.list_public_researchers(page, limit, domain)


@router.get("/{user_id}", response_model=PublicResearcherProfile)
async def get_public_researcher(user_id: str, current_user: dict = Depends(authenticated)):
    return await researcher_service.get_public_researcher(current_user, user_id)
