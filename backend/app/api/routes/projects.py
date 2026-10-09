from fastapi import APIRouter, Depends, File, Query, UploadFile
from fastapi.responses import FileResponse

from app.core.deps import require_role
from app.schemas.analysis import AnalysisResponse
from app.schemas.project import ProjectCreate, ProjectListResponse, ProjectResponse, ProjectUpdate
from app.schemas.research_paper import ResearchPaperResponse
from app.services import analysis_service, project_service

router = APIRouter(prefix="/projects", tags=["projects"])
researcher_only = require_role("researcher")
authenticated = require_role("researcher", "corporate")


@router.post("", response_model=ProjectResponse)
async def create_project(payload: ProjectCreate, current_user: dict = Depends(researcher_only)):
    return await project_service.create_project(current_user, payload)


@router.get("/my", response_model=ProjectListResponse)
async def list_my_projects(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=50),
    current_user: dict = Depends(researcher_only),
):
    return await project_service.list_my_projects(current_user, page, limit)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, current_user: dict = Depends(authenticated)):
    return await project_service.get_project(current_user, project_id)


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    payload: ProjectUpdate,
    current_user: dict = Depends(researcher_only),
):
    return await project_service.update_project(current_user, project_id, payload)


@router.delete("/{project_id}")
async def delete_project(project_id: str, current_user: dict = Depends(researcher_only)):
    return await project_service.delete_project(current_user, project_id)


@router.patch("/{project_id}/publish", response_model=ProjectResponse)
async def publish_project(project_id: str, current_user: dict = Depends(researcher_only)):
    return await project_service.publish_project(current_user, project_id)


@router.patch("/{project_id}/archive", response_model=ProjectResponse)
async def archive_project(project_id: str, current_user: dict = Depends(researcher_only)):
    return await project_service.archive_project(current_user, project_id)


@router.post("/{project_id}/paper", response_model=ResearchPaperResponse)
async def upload_paper(
    project_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(researcher_only),
):
    return await project_service.upload_paper(current_user, project_id, file)


@router.get("/{project_id}/paper", response_model=ResearchPaperResponse)
async def get_paper(project_id: str, current_user: dict = Depends(researcher_only)):
    return await project_service.get_paper(current_user, project_id)


@router.get("/{project_id}/paper/download")
async def download_paper(project_id: str, current_user: dict = Depends(researcher_only)):
    path, filename = await project_service.paper_download_path(current_user, project_id)
    return FileResponse(path, media_type="application/pdf", filename=filename)


@router.delete("/{project_id}/paper")
async def delete_paper(project_id: str, current_user: dict = Depends(researcher_only)):
    return await project_service.delete_paper(current_user, project_id)


@router.post("/{project_id}/analyze", response_model=AnalysisResponse)
async def analyze_project(project_id: str, current_user: dict = Depends(researcher_only)):
    return await analysis_service.analyze_project(current_user, project_id)


@router.get("/{project_id}/analysis", response_model=AnalysisResponse)
async def get_analysis(project_id: str, current_user: dict = Depends(researcher_only)):
    return await analysis_service.get_analysis(current_user, project_id)
