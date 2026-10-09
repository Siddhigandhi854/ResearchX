from typing import Any

from app.utils.object_ids import stringify_id


SAFE_USER_FIELDS = ("name", "email", "role", "is_verified", "is_active", "created_at", "updated_at")


def serialize_user(document: dict[str, Any], *, include_flags: bool = False) -> dict[str, Any]:
    payload = {
        "id": stringify_id(document["_id"]),
        "name": document["name"],
        "email": document["email"],
        "role": document["role"],
    }
    if include_flags:
        payload["is_verified"] = bool(document.get("is_verified", False))
        payload["is_active"] = bool(document.get("is_active", True))
        payload["created_at"] = document.get("created_at")
        payload["updated_at"] = document.get("updated_at")
    return payload


def serialize_profile(document: dict[str, Any] | None) -> dict[str, Any] | None:
    if not document:
        return None
    payload = {key: value for key, value in document.items() if key != "password_hash"}
    payload["id"] = stringify_id(document["_id"])
    payload["user_id"] = stringify_id(document["user_id"])
    payload.pop("_id", None)
    return payload
