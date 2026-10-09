from fastapi import APIRouter, Depends, Query

from app.core.deps import require_role
from app.schemas.problems import ProblemCreate, ProblemListResponse, ProblemResponse, ProblemUpdate
from app.services import problem_service

router = APIRouter(prefix="/problems", tags=["problems"])
corporate_only = require_role("corporate")
authenticated = require_role("researcher", "corporate")


@router.get("", response_model=ProblemListResponse)
async def list_open_problems(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=12, ge=1, le=50),
    domain: str | None = Query(default=None, max_length=120),
    current_user: dict = Depends(authenticated),
):
    return await problem_service.list_open_problems(page, limit, domain)


@router.get("/my", response_model=ProblemListResponse)
async def list_my_problems(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=12, ge=1, le=50),
    current_user: dict = Depends(corporate_only),
):
    return await problem_service.list_my_problems(current_user, page, limit)


@router.post("", response_model=ProblemResponse)
async def create_problem(payload: ProblemCreate, current_user: dict = Depends(corporate_only)):
    return await problem_service.create_problem(current_user, payload)


@router.get("/{problem_id}", response_model=ProblemResponse)
async def get_problem(problem_id: str, current_user: dict = Depends(authenticated)):
    return await problem_service.get_problem(current_user, problem_id)


@router.put("/{problem_id}", response_model=ProblemResponse)
async def update_problem(
    problem_id: str,
    payload: ProblemUpdate,
    current_user: dict = Depends(corporate_only),
):
    return await problem_service.update_problem(current_user, problem_id, payload)


@router.patch("/{problem_id}/publish", response_model=ProblemResponse)
async def publish_problem(problem_id: str, current_user: dict = Depends(corporate_only)):
    return await problem_service.publish_problem(current_user, problem_id)


@router.patch("/{problem_id}/close", response_model=ProblemResponse)
async def close_problem(problem_id: str, current_user: dict = Depends(corporate_only)):
    return await problem_service.close_problem(current_user, problem_id)


@router.delete("/{problem_id}")
async def delete_problem(problem_id: str, current_user: dict = Depends(corporate_only)):
    return await problem_service.delete_problem(current_user, problem_id)
