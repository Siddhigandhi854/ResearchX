from datetime import datetime
from typing import Literal

from pydantic import BaseModel

AnalysisStatus = Literal["pending", "processing", "completed", "complete", "failed"]


class ResearchPaperResponse(BaseModel):
    id: str
    project_id: str
    original_filename: str
    file_size: int
    content_type: str
    page_count: int | None = None
    analysis_status: AnalysisStatus = "pending"
    created_at: datetime | None = None
