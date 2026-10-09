import re

from fastapi import HTTPException, status

from app.db.mongodb import get_database
from app.schemas.collaboration import CollaborationCreate
from app.services import workspace_service
from app.utils.datetime import utc_now
from app.utils.object_ids import parse_object_id, stringify_id

_CONTROL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")


def _sanitize_message(value: str | None) -> str:
    text = _CONTROL.sub("", str(value or "")).strip()
    return text[:1000]


async def _person(db, user_id) -> dict:
    user = await db.users.find_one({"_id": user_id, "is_active": True}, {"name": 1, "role": 1})
    if not user:
        return {"id": stringify_id(user_id), "name": "", "role": "", "profile_image": "", "domain": ""}
    role = user.get("role") or ""
    domain = ""
    image = ""
    if role == "researcher":
        profile = await db.researchers.find_one({"user_id": user_id}, {"profile_image": 1, "research_domains": 1})
        domains = (profile or {}).get("research_domains") or []
        image = (profile or {}).get("profile_image") or ""
        domain = domains[0] if domains else ""
    elif role == "corporate":
        company = await db.companies.find_one({"user_id": user_id}, {"company_name": 1, "industry": 1})
        domain = (company or {}).get("industry") or (company or {}).get("company_name") or ""
    return {
        "id": stringify_id(user_id),
        "name": user.get("name") or "",
        "role": role,
        "profile_image": image,
        "domain": domain,
    }


async def _project_summary(db, project_id) -> dict | None:
    if not project_id:
        return None
    project = await db.projects.find_one({"_id": project_id}, {"title": 1})
    if not project:
        return None
    return {"id": stringify_id(project["_id"]), "title": project.get("title") or ""}


async def _problem_summary(db, problem_id) -> dict | None:
    if not problem_id:
        return None
    problem = await db.industry_problems.find_one({"_id": problem_id}, {"title": 1, "domain": 1})
    if not problem:
        return None
    return {
        "id": stringify_id(problem["_id"]),
        "title": problem.get("title") or "",
        "domain": problem.get("domain") or "",
    }


async def serialize_request(db, document: dict) -> dict:
    return {
        "id": stringify_id(document["_id"]),
        "sender": await _person(db, document["sender_id"]),
        "receiver": await _person(db, document["receiver_id"]),
        "project": await _project_summary(db, document.get("project_id")),
        "problem": await _problem_summary(db, document.get("problem_id")),
        "message": document.get("message") or "",
        "status": document.get("status") or "pending",
        "created_at": document.get("created_at"),
        "responded_at": document.get("responded_at"),
    }


async def create_request(user: dict, payload: CollaborationCreate) -> dict:
    db = get_database()
    receiver_id = parse_object_id(payload.receiver_id, "receiver id")
    if receiver_id == user["_id"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot send a collaboration request to yourself")

    receiver = await db.users.find_one(
        {"_id": receiver_id, "role": {"$in": ["researcher", "corporate"]}, "is_active": True}
    )
    if not receiver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if receiver.get("role") == "researcher":
        receiver_profile = await db.researchers.find_one({"user_id": receiver_id})
        if not receiver_profile or (receiver_profile.get("visibility") or "public") == "private":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Researcher not found")

    project_oid = None
    if payload.project_id:
        if user.get("role") != "researcher":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only researchers can attach a research project",
            )
        project_oid = parse_object_id(payload.project_id, "project id")
        project = await db.projects.find_one({"_id": project_oid})
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        if project.get("researcher_id") != user["_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only attach one of your own projects",
            )

    problem_oid = None
    if payload.problem_id:
        problem_oid = parse_object_id(payload.problem_id, "problem id")
        problem = await db.industry_problems.find_one({"_id": problem_oid})
        if not problem:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem statement not found")
        is_owner = problem.get("company_id") == user["_id"]
        is_open = problem.get("status") == "open"
        if user.get("role") == "corporate" and not is_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only attach one of your own problem statements",
            )
        if user.get("role") == "researcher" and not is_open:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem statement not found")
        if user.get("role") == "researcher" and problem.get("company_id") != receiver_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Send this request to the company that posted the problem",
            )

    pending = await db.collaboration_requests.find_one(
        {
            "status": "pending",
            "$or": [
                {"sender_id": user["_id"], "receiver_id": receiver_id},
                {"sender_id": receiver_id, "receiver_id": user["_id"]},
            ],
        }
    )
    if pending:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A pending collaboration request already exists")

    accepted = await db.collaboration_requests.find_one(
        {
            "status": "accepted",
            "$or": [
                {"sender_id": user["_id"], "receiver_id": receiver_id},
                {"sender_id": receiver_id, "receiver_id": user["_id"]},
            ],
        }
    )
    if accepted:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You are already collaborating with this user")

    now = utc_now()
    document = {
        "sender_id": user["_id"],
        "receiver_id": receiver_id,
        "project_id": project_oid,
        "problem_id": problem_oid,
        "message": _sanitize_message(payload.message),
        "status": "pending",
        "created_at": now,
        "responded_at": None,
    }
    result = await db.collaboration_requests.insert_one(document)
    created = await db.collaboration_requests.find_one({"_id": result.inserted_id})
    return await serialize_request(db, created)


async def list_received(user: dict) -> dict:
    db = get_database()
    cursor = db.collaboration_requests.find({"receiver_id": user["_id"]}).sort("created_at", -1)
    items = [await serialize_request(db, document) async for document in cursor]
    return {"items": items}


async def list_sent(user: dict) -> dict:
    db = get_database()
    cursor = db.collaboration_requests.find({"sender_id": user["_id"]}).sort("created_at", -1)
    items = [await serialize_request(db, document) async for document in cursor]
    return {"items": items}


async def _get_request(db, request_id: str) -> dict:
    document = await db.collaboration_requests.find_one({"_id": parse_object_id(request_id, "request id")})
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collaboration request not found")
    return document


async def accept_request(user: dict, request_id: str) -> dict:
    db = get_database()
    document = await _get_request(db, request_id)
    if document["receiver_id"] != user["_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the receiver can accept this request")
    if document.get("status") != "pending":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only pending requests can be accepted")
    await workspace_service.ensure_workspace_from_request(document)
    now = utc_now()
    await db.collaboration_requests.update_one(
        {"_id": document["_id"]},
        {"$set": {"status": "accepted", "responded_at": now}},
    )
    updated = await db.collaboration_requests.find_one({"_id": document["_id"]})
    return await serialize_request(db, updated)


async def reject_request(user: dict, request_id: str) -> dict:
    db = get_database()
    document = await _get_request(db, request_id)
    if document["receiver_id"] != user["_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the receiver can reject this request")
    if document.get("status") != "pending":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only pending requests can be rejected")
    now = utc_now()
    await db.collaboration_requests.update_one(
        {"_id": document["_id"]},
        {"$set": {"status": "rejected", "responded_at": now}},
    )
    updated = await db.collaboration_requests.find_one({"_id": document["_id"]})
    return await serialize_request(db, updated)


async def cancel_request(user: dict, request_id: str) -> dict:
    db = get_database()
    document = await _get_request(db, request_id)
    if document["sender_id"] != user["_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the sender can cancel this request")
    if document.get("status") != "pending":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only pending requests can be cancelled")
    now = utc_now()
    await db.collaboration_requests.update_one(
        {"_id": document["_id"]},
        {"$set": {"status": "cancelled", "responded_at": now}},
    )
    updated = await db.collaboration_requests.find_one({"_id": document["_id"]})
    return await serialize_request(db, updated)
