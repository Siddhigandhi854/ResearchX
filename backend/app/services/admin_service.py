from fastapi import HTTPException, status
from pymongo import ReturnDocument

from app.db.mongodb import get_database
from app.utils.datetime import utc_now
from app.utils.object_ids import parse_object_id
from app.utils.serializers import serialize_user


async def list_users() -> list[dict]:
    db = get_database()
    users = await db.users.find({}, {"password_hash": 0}).sort("created_at", -1).to_list(500)
    return [serialize_user(user, include_flags=True) for user in users]


async def get_user(user_id: str) -> dict:
    db = get_database()
    user = await db.users.find_one({"_id": parse_object_id(user_id, "user id")}, {"password_hash": 0})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return serialize_user(user, include_flags=True)


async def set_verified(user_id: str, is_verified: bool) -> dict:
    return await _update_user_flags(user_id, {"is_verified": is_verified})


async def set_active(user_id: str, is_active: bool) -> dict:
    return await _update_user_flags(user_id, {"is_active": is_active})


async def _update_user_flags(user_id: str, flags: dict) -> dict:
    db = get_database()
    result = await db.users.find_one_and_update(
        {"_id": parse_object_id(user_id, "user id")},
        {"$set": {**flags, "updated_at": utc_now()}},
        projection={"password_hash": 0},
        return_document=ReturnDocument.AFTER,
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return serialize_user(result, include_flags=True)
