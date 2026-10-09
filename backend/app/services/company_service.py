from fastapi import HTTPException, status
from pymongo import ReturnDocument

from app.db.mongodb import get_database
from app.schemas.companies import CompanyProfileUpdate
from app.utils.datetime import utc_now
from app.utils.serializers import serialize_profile


ALLOWED_FIELDS = {
    "company_name",
    "industry",
    "description",
    "website",
    "location",
    "requirements",
}


async def get_company_profile(user: dict) -> dict:
    db = get_database()
    profile = await db.companies.find_one({"user_id": user["_id"]})
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company profile not found")
    return serialize_profile(profile)


async def update_company_profile(user: dict, payload: CompanyProfileUpdate) -> dict:
    updates = {key: value for key, value in payload.model_dump(exclude_unset=True).items() if key in ALLOWED_FIELDS}
    if not updates:
        return await get_company_profile(user)

    updates["updated_at"] = utc_now()
    db = get_database()
    result = await db.companies.find_one_and_update(
        {"user_id": user["_id"]},
        {"$set": updates},
        return_document=ReturnDocument.AFTER,
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company profile not found")
    return serialize_profile(result)
