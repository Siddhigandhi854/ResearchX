import re

from fastapi import HTTPException, status
from pymongo import ReturnDocument

from app.db.mongodb import get_database
from app.schemas.problems import ProblemCreate, ProblemUpdate
from app.utils.datetime import utc_now
from app.utils.object_ids import parse_object_id, stringify_id
from app.utils.sanitize import sanitize_text

ALLOWED = {"title", "domain", "statement", "desired_outcomes", "technologies"}


async def _company_payload(db, company_id) -> dict:
    user = await db.users.find_one({"_id": company_id}, {"name": 1})
    company = await db.companies.find_one({"user_id": company_id}, {"company_name": 1, "industry": 1})
    return {
        "user_id": stringify_id(company_id),
        "name": (user or {}).get("name") or "",
        "company_name": (company or {}).get("company_name") or "",
        "industry": (company or {}).get("industry") or "",
    }


async def serialize_problem(db, document: dict) -> dict:
    return {
        "id": stringify_id(document["_id"]),
        "company": await _company_payload(db, document["company_id"]),
        "title": document.get("title") or "",
        "domain": document.get("domain") or "",
        "statement": document.get("statement") or "",
        "desired_outcomes": document.get("desired_outcomes") or [],
        "technologies": document.get("technologies") or [],
        "status": document.get("status") or "draft",
        "created_at": document.get("created_at"),
        "updated_at": document.get("updated_at"),
    }


async def create_problem(user: dict, payload: ProblemCreate) -> dict:
    now = utc_now()
    document = {
        "company_id": user["_id"],
        "title": sanitize_text(payload.title, 200),
        "domain": sanitize_text(payload.domain, 120),
        "statement": sanitize_text(payload.statement, 8000),
        "desired_outcomes": payload.desired_outcomes,
        "technologies": payload.technologies,
        "status": "draft",
        "created_at": now,
        "updated_at": now,
    }
    db = get_database()
    result = await db.industry_problems.insert_one(document)
    created = await db.industry_problems.find_one({"_id": result.inserted_id})
    return await serialize_problem(db, created)


async def list_open_problems(page: int, limit: int, domain: str | None = None) -> dict:
    page = max(page, 1)
    limit = min(max(limit, 1), 50)
    query: dict = {"status": "open"}
    term = (domain or "").strip()
    if term:
        query["domain"] = re.compile(re.escape(term), re.IGNORECASE)
    db = get_database()
    total = await db.industry_problems.count_documents(query)
    cursor = db.industry_problems.find(query).sort("updated_at", -1).skip((page - 1) * limit).limit(limit)
    items = [await serialize_problem(db, document) async for document in cursor]
    return {"items": items, "page": page, "limit": limit, "total": total}


async def list_my_problems(user: dict, page: int, limit: int) -> dict:
    page = max(page, 1)
    limit = min(max(limit, 1), 50)
    db = get_database()
    query = {"company_id": user["_id"]}
    total = await db.industry_problems.count_documents(query)
    cursor = db.industry_problems.find(query).sort("updated_at", -1).skip((page - 1) * limit).limit(limit)
    items = [await serialize_problem(db, document) async for document in cursor]
    return {"items": items, "page": page, "limit": limit, "total": total}


async def get_problem(user: dict, problem_id: str) -> dict:
    db = get_database()
    document = await db.industry_problems.find_one({"_id": parse_object_id(problem_id, "problem id")})
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem statement not found")
    is_owner = document.get("company_id") == user["_id"]
    if not is_owner and document.get("status") != "open":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem statement not found")
    return await serialize_problem(db, document)


async def _owned(user: dict, problem_id: str) -> dict:
    db = get_database()
    document = await db.industry_problems.find_one(
        {"_id": parse_object_id(problem_id, "problem id"), "company_id": user["_id"]}
    )
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem statement not found")
    return document


async def update_problem(user: dict, problem_id: str, payload: ProblemUpdate) -> dict:
    await _owned(user, problem_id)
    data = payload.model_dump(exclude_unset=True)
    updates = {key: value for key, value in data.items() if key in ALLOWED}
    if "title" in updates:
        updates["title"] = sanitize_text(updates["title"], 200)
    if "domain" in updates:
        updates["domain"] = sanitize_text(updates["domain"], 120)
    if "statement" in updates:
        updates["statement"] = sanitize_text(updates["statement"], 8000)
    if not updates:
        return await get_problem(user, problem_id)
    updates["updated_at"] = utc_now()
    db = get_database()
    result = await db.industry_problems.find_one_and_update(
        {"_id": parse_object_id(problem_id, "problem id"), "company_id": user["_id"]},
        {"$set": updates},
        return_document=ReturnDocument.AFTER,
    )
    return await serialize_problem(db, result)


async def publish_problem(user: dict, problem_id: str) -> dict:
    document = await _owned(user, problem_id)
    if document.get("status") == "closed":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Closed problems cannot be published")
    db = get_database()
    result = await db.industry_problems.find_one_and_update(
        {"_id": document["_id"]},
        {"$set": {"status": "open", "updated_at": utc_now()}},
        return_document=ReturnDocument.AFTER,
    )
    return await serialize_problem(db, result)


async def close_problem(user: dict, problem_id: str) -> dict:
    document = await _owned(user, problem_id)
    db = get_database()
    result = await db.industry_problems.find_one_and_update(
        {"_id": document["_id"]},
        {"$set": {"status": "closed", "updated_at": utc_now()}},
        return_document=ReturnDocument.AFTER,
    )
    return await serialize_problem(db, result)


async def delete_problem(user: dict, problem_id: str) -> dict:
    document = await _owned(user, problem_id)
    if document.get("status") == "open":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Close the problem before deleting it")
    db = get_database()
    await db.industry_problems.delete_one({"_id": document["_id"]})
    return {"deleted": True}
