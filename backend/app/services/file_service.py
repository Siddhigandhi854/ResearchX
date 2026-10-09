from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

from app.core.config import get_settings

PDF_MAGIC = b"%PDF"
ALLOWED_CONTENT_TYPES = {"application/pdf", "application/x-pdf"}


@dataclass
class StoredFile:
    original_filename: str
    stored_filename: str
    relative_path: str
    absolute_path: Path
    file_size: int
    content_type: str
    page_count: int | None = None


class LocalPdfStorage:
    """Filesystem PDF storage. Swap this class later for S3/Cloudinary/Azure."""

    def __init__(self) -> None:
        settings = get_settings()
        self.root = Path(settings.upload_dir)
        self.max_bytes = settings.max_pdf_size_mb * 1024 * 1024
        self.root.mkdir(parents=True, exist_ok=True)

    def resolve(self, stored_filename: str) -> Path:
        safe_name = Path(stored_filename).name
        if safe_name != stored_filename or ".." in stored_filename or "/" in stored_filename or "\\" in stored_filename:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid stored filename")
        path = (self.root / safe_name).resolve()
        if path.parent.resolve() != self.root.resolve():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid stored filename")
        return path

    async def save_pdf(self, upload: UploadFile) -> StoredFile:
        original = Path(upload.filename or "document.pdf").name
        if not original.lower().endswith(".pdf"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF files are allowed")

        content_type = (upload.content_type or "").split(";")[0].strip().lower()
        if content_type and content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF files are allowed")

        stored_filename = f"{uuid4().hex}.pdf"
        dest = self.root / stored_filename
        size = 0
        header = b""

        try:
            with dest.open("wb") as handle:
                while True:
                    chunk = await upload.read(1024 * 1024)
                    if not chunk:
                        break
                    if size == 0:
                        header = chunk[:8]
                    size += len(chunk)
                    if size > self.max_bytes:
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail=f"PDF must be {get_settings().max_pdf_size_mb} MB or smaller",
                        )
                    handle.write(chunk)
        except HTTPException:
            dest.unlink(missing_ok=True)
            raise
        except Exception:
            dest.unlink(missing_ok=True)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to store the PDF")

        if size == 0:
            dest.unlink(missing_ok=True)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The uploaded file is empty")
        if not header.startswith(PDF_MAGIC):
            dest.unlink(missing_ok=True)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF files are allowed")

        page_count = _pdf_page_count(dest)
        return StoredFile(
            original_filename=original,
            stored_filename=stored_filename,
            relative_path=f"research_papers/{stored_filename}",
            absolute_path=dest,
            file_size=size,
            content_type="application/pdf",
            page_count=page_count,
        )

    def delete(self, stored_filename: str | None) -> None:
        if not stored_filename:
            return
        path = self.resolve(stored_filename)
        path.unlink(missing_ok=True)

    def exists(self, stored_filename: str) -> bool:
        return self.resolve(stored_filename).is_file()


def _pdf_page_count(path: Path) -> int | None:
    try:
        import pymupdf

        document = pymupdf.open(path)
        count = document.page_count
        document.close()
        return count
    except Exception:
        return None


def extract_pdf_text(path: Path, max_chars: int = 80000) -> str:
    try:
        import pymupdf

        document = pymupdf.open(path)
        chunks: list[str] = []
        total = 0
        for index, page in enumerate(document, start=1):
            text = page.get_text("text") or ""
            if len(text.strip()) < 40:
                text = page.get_text("raw") or text
            cleaned = text.strip()
            if cleaned:
                chunks.append(f"--- Page {index} ---\n{cleaned}")
                total += len(cleaned)
            if total >= max_chars:
                break
        document.close()
        return "\n".join(chunks).strip()[:max_chars]
    except Exception:
        return ""


storage = LocalPdfStorage()
