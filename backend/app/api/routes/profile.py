from fastapi import APIRouter, Depends

from app.core.deps import require_role
from app.schemas.researchers import ResearcherProfileResponse, ResearcherProfileUpdate
from app.services import researcher_service

router = APIRouter(prefix="/profile", tags=["profile"])
researcher_only = require_role("researcher")


@router.get("/me", response_model=ResearcherProfileResponse)
async def get_my_profile(current_user: dict = Depends(researcher_only)):
    return await researcher_service.get_researcher_profile(current_user)


@router.put("/me", response_model=ResearcherProfileResponse)
async def update_my_profile(
    payload: ResearcherProfileUpdate,
    current_user: dict = Depends(researcher_only),
):
    return await researcher_service.update_researcher_profile(current_user, payload)
