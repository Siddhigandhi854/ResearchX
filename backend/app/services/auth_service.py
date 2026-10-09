from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.core.security import create_access_token, hash_password, verify_password
from app.db.mongodb import get_database
from app.schemas.auth import LoginRequest, RegisterRequest
from app.utils.datetime import utc_now
from app.utils.serializers import serialize_user


def _empty_researcher_profile(user_id) -> dict:
    now = utc_now()
    return {
        "user_id": user_id,
        "university": "",
        "department": "",
        "research_interests": [],
        "skills": [],
        "technologies": [],
        "research_domains": [],
        "bio": "",
        "publications": [],
        "patents": [],
        "profile_image": "",
        "portfolio_url": "",
        "linkedin_url": "",
        "github_url": "",
        "visibility": "public",
        "created_at": now,
        "updated_at": now,
    }


def _empty_company_profile(user_id) -> dict:
    now = utc_now()
    return {
        "user_id": user_id,
        "company_name": "",
        "industry": "",
        "description": "",
        "website": "",
        "location": "",
        "requirements": [],
        "created_at": now,
        "updated_at": now,
    }


async def register_user(payload: RegisterRequest) -> dict:
    if payload.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin accounts cannot be created through registration",
        )

    db = get_database()
    email = str(payload.email).strip().lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists")

    now = utc_now()
    user_doc = {
        "name": payload.name.strip(),
        "email": email,
        "password_hash": hash_password(payload.password),
        "role": payload.role,
        "is_verified": False,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }

    try:
        result = await db.users.insert_one(user_doc)
    except DuplicateKeyError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists")

    user_id = result.inserted_id
    if payload.role == "researcher":
        await db.researchers.insert_one(_empty_researcher_profile(user_id))
    elif payload.role == "corporate":
        await db.companies.insert_one(_empty_company_profile(user_id))

    created = await db.users.find_one({"_id": user_id})
    return serialize_user(created)


async def login_user(payload: LoginRequest) -> dict:
    db = get_database()
    email = str(payload.email).strip().lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account is inactive")

    token = create_access_token(str(user["_id"]), user["role"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": serialize_user(user),
    }
