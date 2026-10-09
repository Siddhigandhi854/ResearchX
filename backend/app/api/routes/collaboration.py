from fastapi import APIRouter, Depends

from app.core.deps import require_role
from app.schemas.collaboration import CollaborationCreate, CollaborationListResponse, CollaborationRequestResponse
from app.services import collaboration_service

router = APIRouter(prefix="/collaboration/requests", tags=["collaboration"])
authenticated = require_role("researcher", "corporate")


@router.post("", response_model=CollaborationRequestResponse)
async def create_request(payload: CollaborationCreate, current_user: dict = Depends(authenticated)):
    return await collaboration_service.create_request(current_user, payload)


@router.get("/received", response_model=CollaborationListResponse)
async def received_requests(current_user: dict = Depends(authenticated)):
    return await collaboration_service.list_received(current_user)


@router.get("/sent", response_model=CollaborationListResponse)
async def sent_requests(current_user: dict = Depends(authenticated)):
    return await collaboration_service.list_sent(current_user)


@router.patch("/{request_id}/accept", response_model=CollaborationRequestResponse)
async def accept_request(request_id: str, current_user: dict = Depends(authenticated)):
    return await collaboration_service.accept_request(current_user, request_id)


@router.patch("/{request_id}/reject", response_model=CollaborationRequestResponse)
async def reject_request(request_id: str, current_user: dict = Depends(authenticated)):
    return await collaboration_service.reject_request(current_user, request_id)


@router.patch("/{request_id}/cancel", response_model=CollaborationRequestResponse)
async def cancel_request(request_id: str, current_user: dict = Depends(authenticated)):
    return await collaboration_service.cancel_request(current_user, request_id)
