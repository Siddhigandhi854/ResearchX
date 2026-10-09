from fastapi import APIRouter, Depends

from app.core.deps import require_role
from app.schemas.companies import CompanyProfileResponse, CompanyProfileUpdate
from app.services import company_service

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("/me", response_model=CompanyProfileResponse)
async def get_my_profile(current_user: dict = Depends(require_role("corporate"))):
    return await company_service.get_company_profile(current_user)


@router.put("/me", response_model=CompanyProfileResponse)
async def update_my_profile(
    payload: CompanyProfileUpdate,
    current_user: dict = Depends(require_role("corporate")),
):
    return await company_service.update_company_profile(current_user, payload)
