from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.db.mongodb import ping_database

router = APIRouter()


@router.get("/")
async def root():
    return {"message": "ResearchX API is running"}


@router.get("/health")
async def health():
    connected = await ping_database()
    payload = {
        "status": "healthy" if connected else "unhealthy",
        "database": "connected" if connected else "disconnected",
    }
    if not connected:
        return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content=payload)
    return payload
