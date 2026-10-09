from fastapi.middleware.cors import CORSMiddleware

from app.core.config import Settings


def add_cors_middleware(app, settings: Settings) -> None:
    """Allow the Vite frontend origin locally; override CORS_ORIGINS for production."""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
