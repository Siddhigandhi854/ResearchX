from fastapi import APIRouter

from app.api.routes import admin, auth, collaboration, companies, problems, profile, projects, recommendations, researchers, status, workspaces

api_router = APIRouter()
api_router.include_router(status.router, tags=["v1"])
api_router.include_router(auth.router)
api_router.include_router(researchers.router)
api_router.include_router(profile.router)
api_router.include_router(companies.router)
api_router.include_router(admin.router)
api_router.include_router(projects.router)
api_router.include_router(recommendations.router)
api_router.include_router(collaboration.router)
api_router.include_router(problems.router)
api_router.include_router(workspaces.router)
