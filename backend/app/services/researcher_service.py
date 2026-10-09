import re

from fastapi import HTTPException, status
from pymongo import ReturnDocument

from app.db.mongodb import get_database
from app.schemas.researchers import ResearcherProfileUpdate
from app.utils.datetime import utc_now
from app.utils.object_ids import parse_object_id, stringify_id

ALLOWED_FIELDS = {
    "university",
    "department",
    "research_interests",
    "skills",
    "technologies",
    "research_domains",
    "bio",
    "publications",
    "patents",
    "profile_image",
    "portfolio_url",
    "linkedin_url",
    "github_url",
    "visibility",
}


def serialize_own_profile(profile: dict, user: dict) -> dict:
    university = profile.get("university") or profile.get("institution") or ""
    return {
        "id": stringify_id(profile["_id"]),
        "user_id": stringify_id(profile["user_id"]),
        "name": user.get("name") or "",
        "university": university,
        "institution": university,
        "department": profile.get("department") or "",
        "research_interests": profile.get("research_interests") or [],
        "skills": profile.get("skills") or [],
        "technologies": profile.get("technologies") or [],
        "research_domains": profile.get("research_domains") or [],
        "bio": profile.get("bio") or "",
        "publications": profile.get("publications") or [],
        "patents": profile.get("patents") or [],
        "profile_image": profile.get("profile_image") or "",
        "portfolio_url": profile.get("portfolio_url") or "",
        "linkedin_url": profile.get("linkedin_url") or "",
        "github_url": profile.get("github_url") or "",
        "visibility": profile.get("visibility") or "public",
        "created_at": profile.get("created_at"),
        "updated_at": profile.get("updated_at"),
    }


def serialize_public_profile(profile: dict, user: dict, projects: list[dict]) -> dict:
    university = profile.get("university") or profile.get("institution") or ""
    return {
        "user_id": stringify_id(user["_id"]),
        "name": user.get("name") or "",
        "bio": profile.get("bio") or "",
        "institution": university,
        "department": profile.get("department") or "",
        "research_interests": profile.get("research_interests") or [],
        "skills": profile.get("skills") or [],
        "technologies": profile.get("technologies") or [],
        "research_domains": profile.get("research_domains") or [],
        "profile_image": profile.get("profile_image") or "",
        "portfolio_url": profile.get("portfolio_url") or "",
        "linkedin_url": profile.get("linkedin_url") or "",
        "github_url": profile.get("github_url") or "",
        "projects": projects,
    }


async def get_researcher_profile(user: dict) -> dict:
    db = get_database()
    profile = await db.researchers.find_one({"user_id": user["_id"]})
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Researcher profile not found")
    return serialize_own_profile(profile, user)


async def update_researcher_profile(user: dict, payload: ResearcherProfileUpdate) -> dict:
    data = payload.model_dump(exclude_unset=True)
    if data.get("institution") is not None and data.get("university") is None:
        data["university"] = data["institution"]
    data.pop("institution", None)
    updates = {key: value for key, value in data.items() if key in ALLOWED_FIELDS}
    if not updates:
        return await get_researcher_profile(user)

    updates["updated_at"] = utc_now()
    db = get_database()
    result = await db.researchers.find_one_and_update(
        {"user_id": user["_id"]},
        {"$set": updates},
        return_document=ReturnDocument.AFTER,
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Researcher profile not found")
    return serialize_own_profile(result, user)


async def _public_projects(db, researcher_id) -> list[dict]:
    cursor = db.projects.find(
        {"researcher_id": researcher_id, "visibility": "public", "status": "published"},
        {
            "title": 1,
            "research_domain": 1,
            "problem_statement": 1,
            "technologies": 1,
            "prototype_status": 1,
            "research_analysis": 1,
        },
    ).sort("updated_at", -1)
    items = []
    async for project in cursor:
        analysis = project.get("research_analysis") or {}
        description = (analysis.get("abstract") or project.get("problem_statement") or "")[:280]
        items.append(
            {
                "id": stringify_id(project["_id"]),
                "title": project.get("title") or "",
                "domain": analysis.get("domain") or project.get("research_domain") or "",
                "description": description,
                "technologies": analysis.get("technologies") or project.get("technologies") or [],
                "research_stage": analysis.get("research_stage") or project.get("prototype_status") or "",
            }
        )
    return items


async def get_public_researcher(viewer: dict, user_id: str) -> dict:
    db = get_database()
    oid = parse_object_id(user_id, "user id")
    user = await db.users.find_one({"_id": oid, "role": "researcher", "is_active": True})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Researcher not found")
    profile = await db.researchers.find_one({"user_id": oid})
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Researcher not found")
    is_owner = viewer["_id"] == oid
    if (profile.get("visibility") or "public") == "private" and not is_owner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Researcher not found")
    projects = await _public_projects(db, oid)
    return serialize_public_profile(profile, user, projects)


async def list_public_researchers(page: int, limit: int, domain: str | None = None) -> dict:
    page = max(page, 1)
    limit = min(max(limit, 1), 50)
    db = get_database()
    query: dict = {"visibility": {"$ne": "private"}}
    term = (domain or "").strip()
    if term:
        pattern = re.compile(re.escape(term), re.IGNORECASE)
        query["$or"] = [
            {"research_domains": pattern},
            {"research_interests": pattern},
            {"skills": pattern},
            {"department": pattern},
        ]
    total = await db.researchers.count_documents(query)
    cursor = db.researchers.find(query).sort("updated_at", -1).skip((page - 1) * limit).limit(limit)
    items = []
    async for profile in cursor:
        user = await db.users.find_one(
            {"_id": profile["user_id"], "role": "researcher", "is_active": True},
            {"name": 1},
        )
        if not user:
            continue
        university = profile.get("university") or profile.get("institution") or ""
        items.append(
            {
                "user_id": stringify_id(profile["user_id"]),
                "name": user.get("name") or "",
                "institution": university,
                "department": profile.get("department") or "",
                "research_domains": profile.get("research_domains") or [],
                "profile_image": profile.get("profile_image") or "",
            }
        )
    return {"items": items, "page": page, "limit": limit, "total": total}
