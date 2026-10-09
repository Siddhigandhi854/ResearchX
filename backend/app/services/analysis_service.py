import asyncio

from fastapi import HTTPException, status

from app.db.mongodb import get_database
from app.services.file_service import extract_pdf_text, storage
from app.services.gemini_service import analyze_research_text
from app.services.project_service import _owned_project, _paper_for
from app.utils.datetime import utc_now


def _public_error(detail: str) -> str:
    allowed = (
        "AI analysis is not configured",
        "No text could be extracted from this PDF",
        "The AI response could not be validated",
        "The AI could not extract research fields from this paper. Try a text-based PDF.",
        "The configured Gemini model is unavailable",
        "The AI service is busy. Please retry in a moment",
        "Upload a research paper before analysis",
        "The research paper file is missing",
    )
    if detail in allowed:
        return detail
    return "Unable to analyze the research paper"


def serialize_analysis(project: dict) -> dict:
    analysis = project.get("research_analysis")
    return {
        "analysis_status": project.get("analysis_status") or "pending",
        "analysis_error": project.get("analysis_error"),
        "analyzed_at": project.get("analyzed_at"),
        "research_analysis": analysis,
    }


async def get_analysis(user: dict, project_id: str) -> dict:
    project = await _owned_project(user, project_id)
    return serialize_analysis(project)


async def analyze_project(user: dict, project_id: str) -> dict:
    project = await _owned_project(user, project_id)
    db = get_database()
    paper = await _paper_for(db, project["_id"])
    if not paper:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Upload a research paper before analysis")

    stored = paper.get("stored_filename")
    if not stored or not storage.exists(stored):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="The research paper file is missing")

    now = utc_now()
    await db.projects.update_one(
        {"_id": project["_id"]},
        {
            "$set": {
                "analysis_status": "processing",
                "ai_analysis_status": "processing",
                "analysis_error": None,
                "updated_at": now,
            }
        },
    )
    await db.research_papers.update_one(
        {"_id": paper["_id"]},
        {"$set": {"analysis_status": "processing", "updated_at": now}},
    )

    try:
        pdf_path = storage.resolve(stored)
        extracted = await asyncio.to_thread(extract_pdf_text, pdf_path)
        if not extracted:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="No text could be extracted from this PDF",
            )
        analysis = await asyncio.to_thread(analyze_research_text, extracted, pdf_path)
        payload = analysis.model_dump()
        finished = utc_now()
        await db.projects.update_one(
            {"_id": project["_id"]},
            {
                "$set": {
                    "research_analysis": payload,
                    "analysis_status": "completed",
                    "ai_analysis_status": "completed",
                    "ai_summary": payload.get("abstract") or None,
                    "analysis_error": None,
                    "analyzed_at": finished,
                    "updated_at": finished,
                }
            },
        )
        await db.research_papers.update_one(
            {"_id": paper["_id"]},
            {
                "$set": {
                    "extracted_text": extracted,
                    "analysis_status": "completed",
                    "updated_at": finished,
                }
            },
        )
        updated = await db.projects.find_one({"_id": project["_id"]})
        return serialize_analysis(updated)
    except HTTPException as exc:
        await _mark_failed(db, project["_id"], paper["_id"], _public_error(str(exc.detail)))
        raise HTTPException(status_code=exc.status_code, detail=_public_error(str(exc.detail)))
    except Exception:
        await _mark_failed(db, project["_id"], paper["_id"], "Unable to analyze the research paper")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to analyze the research paper",
        )


async def _mark_failed(db, project_id, paper_id, message: str) -> None:
    now = utc_now()
    await db.projects.update_one(
        {"_id": project_id},
        {
            "$set": {
                "analysis_status": "failed",
                "ai_analysis_status": "failed",
                "analysis_error": message,
                "updated_at": now,
            }
        },
    )
    await db.research_papers.update_one(
        {"_id": paper_id},
        {"$set": {"analysis_status": "failed", "updated_at": now}},
    )
