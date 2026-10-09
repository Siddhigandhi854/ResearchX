from fastapi import APIRouter, Depends, status

from app.core.deps import get_current_user
from app.schemas.auth import LoginRequest, PublicUser, RegisterRequest, TokenResponse
from app.services import auth_service
from app.utils.serializers import serialize_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=PublicUser, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest):
    return await auth_service.register_user(payload)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    return await auth_service.login_user(payload)


@router.get("/me", response_model=PublicUser)
async def me(current_user: dict = Depends(get_current_user)):
    return serialize_user(current_user)
