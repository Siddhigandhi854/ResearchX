from fastapi import APIRouter, Depends

from app.core.deps import require_role
from app.schemas.users import AdminUserResponse
from app.services import admin_service

router = APIRouter(prefix="/admin", tags=["admin"])
admin_user = require_role("admin")


@router.get("/users", response_model=list[AdminUserResponse])
async def list_users(_: dict = Depends(admin_user)):
    return await admin_service.list_users()


@router.get("/users/{user_id}", response_model=AdminUserResponse)
async def get_user(user_id: str, _: dict = Depends(admin_user)):
    return await admin_service.get_user(user_id)


@router.patch("/users/{user_id}/verify", response_model=AdminUserResponse)
async def verify_user(user_id: str, _: dict = Depends(admin_user)):
    return await admin_service.set_verified(user_id, True)


@router.patch("/users/{user_id}/activate", response_model=AdminUserResponse)
async def activate_user(user_id: str, _: dict = Depends(admin_user)):
    return await admin_service.set_active(user_id, True)


@router.patch("/users/{user_id}/deactivate", response_model=AdminUserResponse)
async def deactivate_user(user_id: str, _: dict = Depends(admin_user)):
    return await admin_service.set_active(user_id, False)
