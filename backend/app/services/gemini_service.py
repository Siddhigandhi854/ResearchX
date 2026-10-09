import json
import re
from pathlib import Path

from fastapi import HTTPException, status
from google import genai
from google.genai import types

from app.core.config import get_settings
from app.schemas.analysis import ResearchAnalysis

PROMPT = """You analyze academic research papers for an industry-collaboration platform.

Read the attached PDF and/or extracted text. Fill EVERY field using evidence from the paper.
Summarize in your own words when a section heading is missing. Infer domain, keywords,
technologies, and skills from the methods and content.

Do not leave fields empty if the paper contains enough information to answer them.
Only use an empty string or empty array when the paper truly has no evidence.

Return JSON with exactly these keys:
title, research_problem, abstract, objectives, methodology, technologies, domain,
keywords, dataset, results, future_scope, innovation, research_stage, skills_required.
"""

JSON_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "title": {"type": "string"},
        "research_problem": {"type": "string"},
        "abstract": {"type": "string"},
        "objectives": {"type": "array", "items": {"type": "string"}},
        "methodology": {"type": "string"},
        "technologies": {"type": "array", "items": {"type": "string"}},
        "domain": {"type": "string"},
        "keywords": {"type": "array", "items": {"type": "string"}},
        "dataset": {"type": "string"},
        "results": {"type": "string"},
        "future_scope": {"type": "string"},
        "innovation": {"type": "string"},
        "research_stage": {"type": "string"},
        "skills_required": {"type": "array", "items": {"type": "string"}},
    },
    "required": [
        "title",
        "research_problem",
        "abstract",
        "objectives",
        "methodology",
        "technologies",
        "domain",
        "keywords",
        "dataset",
        "results",
        "future_scope",
        "innovation",
        "research_stage",
        "skills_required",
    ],
}


def _parse_json_text(raw: str) -> dict:
    text = (raw or "").strip()
    fenced = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fenced:
        text = fenced.group(1).strip()
    return json.loads(text)


def _is_blank(analysis: ResearchAnalysis) -> bool:
    data = analysis.model_dump()
    for value in data.values():
        if isinstance(value, list) and any(str(item).strip() for item in value):
            return False
        if isinstance(value, str) and value.strip():
            return False
    return True


def _raise_gemini_failure(exc: Exception) -> None:
    message = str(exc)
    lowered = message.lower()
    if "not configured" in lowered or "api key" in lowered or "unauthenticated" in lowered or "401" in lowered:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI analysis is not configured",
        ) from exc
    if "404" in lowered or "not found" in lowered or "no longer available" in lowered:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The configured Gemini model is unavailable",
        ) from exc
    if "429" in lowered or "resource exhausted" in lowered or "high demand" in lowered or "unavailable" in lowered:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The AI service is busy. Please retry in a moment",
        ) from exc
    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="Unable to analyze the research paper",
    ) from exc


def _to_analysis(response) -> ResearchAnalysis | None:
    parsed = getattr(response, "parsed", None)
    if isinstance(parsed, ResearchAnalysis):
        return parsed
    if isinstance(parsed, dict):
        try:
            return ResearchAnalysis.model_validate(parsed)
        except Exception:
            parsed = None
    try:
        data = _parse_json_text(getattr(response, "text", "") or "")
        return ResearchAnalysis.model_validate(data)
    except Exception:
        return None


def _generate(client, model: str, contents) -> ResearchAnalysis | None:
    try:
        response = client.models.generate_content(
            model=model,
            contents=contents,
            config=types.GenerateContentConfig(
                temperature=0.2,
                response_mime_type="application/json",
                response_json_schema=JSON_SCHEMA,
            ),
        )
    except HTTPException:
        raise
    except Exception as exc:
        _raise_gemini_failure(exc)
    return _to_analysis(response)


def analyze_research_text(paper_text: str, pdf_path: str | Path | None = None) -> ResearchAnalysis:
    settings = get_settings()
    api_key = (settings.gemini_api_key or "").strip()
    if not api_key or api_key.startswith("your_gemini"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI analysis is not configured",
        )

    excerpt = (paper_text or "").strip()
    pdf_bytes = b""
    if pdf_path:
        try:
            pdf_bytes = Path(pdf_path).read_bytes()
        except OSError:
            pdf_bytes = b""

    if not excerpt and not pdf_bytes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No text could be extracted from this PDF",
        )

    client = genai.Client(api_key=api_key)
    model = settings.gemini_model
    attempts: list = []

    if pdf_bytes.startswith(b"%PDF"):
        pdf_parts = [
            types.Part.from_text(text=PROMPT),
            types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf"),
        ]
        if excerpt:
            pdf_parts.append(types.Part.from_text(text="Extracted text:\n" + excerpt[:60000]))
        attempts.append(pdf_parts)

    if excerpt:
        attempts.append(PROMPT + "\n\nPaper text:\n" + excerpt[:80000])

    last_error = None
    for contents in attempts:
        try:
            analysis = _generate(client, model, contents)
        except HTTPException as exc:
            last_error = exc
            continue
        if analysis and not _is_blank(analysis):
            return analysis

    if last_error:
        raise last_error
    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="The AI could not extract research fields from this paper. Try a text-based PDF.",
    )
