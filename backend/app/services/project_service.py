from fastapi import HTTPException, UploadFile, status
from pymongo import ReturnDocument

from app.db.mongodb import get_database
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.services.file_service import storage
from app.utils.datetime import utc_now
from app.utils.object_ids import parse_object_id, stringify_id

ALLOWED_PROJECT_FIELDS = {
    "title",
    "problem_statement",
    "proposed_solution",
    "research_domain",
    "technologies",
    "methodology",
    "results",
    "prototype_status",
    "industry_applications",
    "github_url",
    "demo_url",
    "research_interests",
    "status",
    "visibility",
}

PUBLISH_REQUIRED = ("title", "problem_statement", "proposed_solution", "research_domain")


def serialize_project(document: dict, *, researcher_name: str | None = None, paper: dict | None = None) -> dict:
    return {
        "id": stringify_id(document["_id"]),
        "researcher_id": stringify_id(document["researcher_id"]),
        "researcher_name": researcher_name,
        "title": document["title"],
        "problem_statement": document.get("problem_statement", ""),
        "proposed_solution": document.get("proposed_solution", ""),
        "research_domain": document.get("research_domain", ""),
        "technologies": document.get("technologies", []),
        "methodology": document.get("methodology", ""),
        "results": document.get("results", ""),
        "prototype_status": document.get("prototype_status", "Research"),
        "industry_applications": document.get("industry_applications", []),
        "github_url": document.get("github_url", ""),
        "demo_url": document.get("demo_url", ""),
        "research_interests": document.get("research_interests", []),
        "status": document.get("status", "draft"),
        "visibility": document.get("visibility", "public"),
        "ai_analysis_status": document.get("analysis_status") or document.get("ai_analysis_status") or "pending",
        "analysis_status": document.get("analysis_status") or document.get("ai_analysis_status") or "pending",
        "analysis_error": document.get("analysis_error"),
        "analyzed_at": document.get("analyzed_at"),
        "research_analysis": document.get("research_analysis"),
        "ai_summary": document.get("ai_summary"),
        "has_paper": bool(paper),
        "paper_filename": paper.get("original_filename") if paper else None,
        "created_at": document.get("created_at"),
        "updated_at": document.get("updated_at"),
    }


def serialize_paper(document: dict) -> dict:
    return {
        "id": stringify_id(document["_id"]),
        "project_id": stringify_id(document["project_id"]),
        "original_filename": document["original_filename"],
        "file_size": document["file_size"],
        "content_type": document.get("content_type", "application/pdf"),
        "page_count": document.get("page_count"),
        "analysis_status": document.get("analysis_status", "pending"),
        "created_at": document.get("created_at"),
    }


async def _paper_for(db, project_id) -> dict | None:
    return await db.research_papers.find_one({"project_id": project_id})


async def _owned_project(user: dict, project_id: str) -> dict:
    db = get_database()
    oid = parse_object_id(project_id, "project id")
    project = await db.projects.find_one({"_id": oid})
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project["researcher_id"] != user["_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this project")
    return project


async def create_project(user: dict, payload: ProjectCreate) -> dict:
    db = get_database()
    now = utc_now()
    document = {
        "researcher_id": user["_id"],
        **payload.model_dump(),
        "status": "draft",
        "visibility": "public",
        "ai_analysis_status": "pending",
        "analysis_status": "pending",
        "research_analysis": None,
        "analysis_error": None,
        "analyzed_at": None,
        "ai_summary": None,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.projects.insert_one(document)
    created = await db.projects.find_one({"_id": result.inserted_id})
    return serialize_project(created, researcher_name=user.get("name"))


async def list_my_projects(user: dict, page: int, limit: int) -> dict:
    page = max(page, 1)
    limit = min(max(limit, 1), 50)
    db = get_database()
    query = {"researcher_id": user["_id"]}
    total = await db.projects.count_documents(query)
    cursor = db.projects.find(query).sort("created_at", -1).skip((page - 1) * limit).limit(limit)
    items = []
    async for project in cursor:
        paper = await _paper_for(db, project["_id"])
        items.append(serialize_project(project, researcher_name=user.get("name"), paper=paper))
    return {"items": items, "page": page, "limit": limit, "total": total}


async def get_project(user: dict, project_id: str) -> dict:
    db = get_database()
    project = await _readable_project(user, project_id)
    paper = await _paper_for(db, project["_id"])
    owner = await db.users.find_one({"_id": project["researcher_id"]}, {"name": 1})
    payload = serialize_project(project, researcher_name=(owner or {}).get("name"), paper=paper)
    if project["researcher_id"] != user["_id"]:
        payload["analysis_error"] = None
    return payload


async def _readable_project(user: dict, project_id: str) -> dict:
    db = get_database()
    project = await db.projects.find_one({"_id": parse_object_id(project_id, "project id")})
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    is_owner = project["researcher_id"] == user["_id"]
    is_public = project.get("visibility") == "public" and project.get("status") == "published"
    if not is_owner and not is_public:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this project")
    return project


async def update_project(user: dict, project_id: str, payload: ProjectUpdate) -> dict:
    await _owned_project(user, project_id)
    updates = {key: value for key, value in payload.model_dump(exclude_unset=True).items() if key in ALLOWED_PROJECT_FIELDS}
    if not updates:
        return await get_project(user, project_id)
    updates["updated_at"] = utc_now()
    db = get_database()
    result = await db.projects.find_one_and_update(
        {"_id": parse_object_id(project_id, "project id"), "researcher_id": user["_id"]},
        {"$set": updates},
        return_document=ReturnDocument.AFTER,
    )
    paper = await _paper_for(db, result["_id"])
    return serialize_project(result, researcher_name=user.get("name"), paper=paper)


async def delete_project(user: dict, project_id: str) -> dict:
    project = await _owned_project(user, project_id)
    db = get_database()
    paper = await _paper_for(db, project["_id"])
    if paper:
        storage.delete(paper.get("stored_filename"))
        await db.research_papers.delete_one({"_id": paper["_id"]})
    await db.projects.delete_one({"_id": project["_id"]})
    return {"message": "Project deleted"}


async def publish_project(user: dict, project_id: str) -> dict:
    project = await _owned_project(user, project_id)
    missing = [field for field in PUBLISH_REQUIRED if not str(project.get(field, "")).strip()]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Cannot publish until these fields are complete: {', '.join(missing)}",
        )
    db = get_database()
    result = await db.projects.find_one_and_update(
        {"_id": project["_id"]},
        {"$set": {"status": "published", "updated_at": utc_now()}},
        return_document=ReturnDocument.AFTER,
    )
    paper = await _paper_for(db, result["_id"])
    return serialize_project(result, researcher_name=user.get("name"), paper=paper)


async def archive_project(user: dict, project_id: str) -> dict:
    project = await _owned_project(user, project_id)
    db = get_database()
    result = await db.projects.find_one_and_update(
        {"_id": project["_id"]},
        {"$set": {"status": "archived", "updated_at": utc_now()}},
        return_document=ReturnDocument.AFTER,
    )
    paper = await _paper_for(db, result["_id"])
    return serialize_project(result, researcher_name=user.get("name"), paper=paper)


async def get_paper(user: dict, project_id: str) -> dict:
    project = await _owned_project(user, project_id)
    db = get_database()
    paper = await _paper_for(db, project["_id"])
    if not paper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No research paper uploaded")
    return serialize_paper(paper)


async def paper_download_path(user: dict, project_id: str) -> tuple:
    project = await _owned_project(user, project_id)
    db = get_database()
    paper = await _paper_for(db, project["_id"])
    if not paper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No research paper uploaded")
    stored = paper.get("stored_filename")
    if not stored or not storage.exists(stored):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="The research paper file is missing")
    return storage.resolve(stored), paper["original_filename"]


async def upload_paper(user: dict, project_id: str, upload: UploadFile) -> dict:
    if not upload or not upload.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A PDF file is required")

    project = await _owned_project(user, project_id)
    stored = await storage.save_pdf(upload)
    db = get_database()
    existing = await _paper_for(db, project["_id"])
    now = utc_now()
    paper_doc = {
        "project_id": project["_id"],
        "researcher_id": user["_id"],
        "original_filename": stored.original_filename,
        "stored_filename": stored.stored_filename,
        "file_path": stored.relative_path,
        "file_size": stored.file_size,
        "content_type": stored.content_type,
        "extracted_text": None,
        "page_count": stored.page_count,
        "analysis_status": "pending",
        "updated_at": now,
    }

    try:
        if existing:
            await db.research_papers.update_one(
                {"_id": existing["_id"]},
                {"$set": paper_doc},
            )
            storage.delete(existing.get("stored_filename"))
            updated = await db.research_papers.find_one({"_id": existing["_id"]})
        else:
            paper_doc["created_at"] = now
            result = await db.research_papers.insert_one(paper_doc)
            updated = await db.research_papers.find_one({"_id": result.inserted_id})
        await db.projects.update_one(
            {"_id": project["_id"]},
            {
                "$set": {
                    "updated_at": now,
                    "analysis_status": "pending",
                    "ai_analysis_status": "pending",
                    "research_analysis": None,
                    "analysis_error": None,
                    "analyzed_at": None,
                    "ai_summary": None,
                }
            },
        )
    except Exception:
        storage.delete(stored.stored_filename)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to save the research paper")

    return serialize_paper(updated)


async def delete_paper(user: dict, project_id: str) -> dict:
    project = await _owned_project(user, project_id)
    db = get_database()
    paper = await _paper_for(db, project["_id"])
    if not paper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No research paper uploaded")
    storage.delete(paper.get("stored_filename"))
    await db.research_papers.delete_one({"_id": paper["_id"]})
    await db.projects.update_one(
        {"_id": project["_id"]},
        {
            "$set": {
                "updated_at": utc_now(),
                "analysis_status": "pending",
                "ai_analysis_status": "pending",
                "research_analysis": None,
                "analysis_error": None,
                "analyzed_at": None,
                "ai_summary": None,
            }
        },
    )
    return {"message": "Research paper deleted"}
