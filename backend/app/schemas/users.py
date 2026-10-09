from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.schemas.auth import UserRole


class AdminUserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: UserRole
    is_verified: bool
    is_active: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None
