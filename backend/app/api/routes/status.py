from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def api_v1_root():
    return {"message": "ResearchX API v1", "version": "1.0.0"}
