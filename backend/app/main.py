from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.router import api_router
from app.api.routes import health
from app.core.config import get_settings
from app.core.cors import add_cors_middleware
from app.db.indexes import initialize_collections
from app.db.mongodb import close_mongo_connection, connect_to_mongo, get_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    await initialize_collections(get_database())
    yield
    await close_mongo_connection()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="ResearchX API",
        description="Academic-industry collaboration platform API",
        version="0.1.0",
        lifespan=lifespan,
    )
    add_cors_middleware(app, settings)
    app.include_router(health.router)
    app.include_router(api_router, prefix="/api/v1")
    return app


app = create_app()


