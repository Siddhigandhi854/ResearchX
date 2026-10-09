from collections import defaultdict

from fastapi import HTTPException, status

from app.db.mongodb import get_database
from app.utils.object_ids import parse_object_id, stringify_id
from app.utils.text_similarity import (
    calculate_jaccard_similarity,
    calculate_text_similarity,
    normalize_text,
    overlapping_terms,
)

FIELD_WEIGHTS = {
    "domain": 0.25,
    "keywords": 0.20,
    "technologies": 0.15,
    "skills": 0.15,
    "research_problem": 0.10,
    "methodology": 0.05,
    "objectives": 0.05,
    "innovation": 0.05,
}

MATCH_FIELD_THRESHOLD = 0.4
SCORE_THRESHOLD = 40
CANDIDATE_PROJECTION = {
    "_id": 1,
    "title": 1,
    "research_domain": 1,
    "researcher_id": 1,
    "visibility": 1,
    "status": 1,
    "research_analysis": 1,
    "technologies": 1,
    "methodology": 1,
    "problem_statement": 1,
}

EMPTY_MESSAGE = "No strong research matches found yet."


def _as_list(value) -> list:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item) for item in value if str(item).strip()]
    text = str(value).strip()
    return [text] if text else []


def matching_profile(project: dict) -> dict:
    analysis = project.get("research_analysis") or {}
    if not isinstance(analysis, dict):
        analysis = {}
    return {
        "domain": analysis.get("domain") or project.get("research_domain") or "",
        "keywords": _as_list(analysis.get("keywords")),
        "technologies": _as_list(analysis.get("technologies")) or _as_list(project.get("technologies")),
        "skills": _as_list(analysis.get("skills_required")),
        "research_problem": analysis.get("research_problem") or project.get("problem_statement") or "",
        "methodology": analysis.get("methodology") or project.get("methodology") or "",
        "objectives": _as_list(analysis.get("objectives")),
        "innovation": analysis.get("innovation") or "",
    }


def _field_score(field: str, source: dict, candidate: dict) -> float:
    left = source.get(field)
    right = candidate.get(field)
    if field in {"keywords", "technologies", "skills", "objectives"}:
        return calculate_jaccard_similarity(left, right)
    if field == "domain":
        if normalize_text(left) and normalize_text(left) == normalize_text(right):
            return 1.0
        return calculate_text_similarity(left, right)
    return calculate_text_similarity(left, right)


def calculate_project_similarity(source_profile: dict, candidate_profile: dict) -> dict:
    field_scores: dict[str, float] = {}
    weighted = 0.0
    for field, weight in FIELD_WEIGHTS.items():
        score = _field_score(field, source_profile, candidate_profile)
        field_scores[field] = score
        weighted += score * weight
    similarity = int(round(min(1.0, max(0.0, weighted)) * 100))
    matched_fields = [field for field, score in field_scores.items() if score >= MATCH_FIELD_THRESHOLD]
    return {
        "similarity_score": similarity,
        "field_scores": field_scores,
        "matched_fields": matched_fields,
        "matched_skills": overlapping_terms(source_profile.get("skills"), candidate_profile.get("skills")),
        "matched_technologies": overlapping_terms(
            source_profile.get("technologies"),
            candidate_profile.get("technologies"),
        ),
        "matched_keywords": overlapping_terms(source_profile.get("keywords"), candidate_profile.get("keywords")),
        "matched_domain": overlapping_terms(
            tokenize_or_term(source_profile.get("domain")),
            tokenize_or_term(candidate_profile.get("domain")),
        ),
    }


def tokenize_or_term(value: str | None) -> list[str]:
    text = normalize_text(value)
    return [text] if text else []


def generate_match_reason(match: dict, source_profile: dict, candidate_profile: dict) -> str:
    parts: list[str] = []
    source_domain = normalize_text(source_profile.get("domain"))
    candidate_domain = normalize_text(candidate_profile.get("domain"))
    if "domain" in match["matched_fields"] and source_domain and candidate_domain:
        if source_domain == candidate_domain:
            parts.append(f"shared research domain {source_profile.get('domain')}")
        else:
            parts.append("related research domains")
    if match["matched_technologies"]:
        parts.append("shared technologies " + ", ".join(match["matched_technologies"][:6]))
    if match["matched_skills"]:
        parts.append("shared skills " + ", ".join(match["matched_skills"][:6]))
    if match["matched_keywords"]:
        parts.append("shared keywords " + ", ".join(match["matched_keywords"][:6]))
    if match["field_scores"].get("research_problem", 0) >= MATCH_FIELD_THRESHOLD:
        parts.append("similar research problems")
    if match["field_scores"].get("methodology", 0) >= MATCH_FIELD_THRESHOLD:
        parts.append("similar methodology")
    if match["field_scores"].get("objectives", 0) >= MATCH_FIELD_THRESHOLD:
        parts.append("overlapping objectives")
    if match["field_scores"].get("innovation", 0) >= MATCH_FIELD_THRESHOLD:
        parts.append("similar innovation focus")
    if not parts:
        return ""
    sentence = "Both projects have " + "; ".join(parts) + "."
    return sentence[0].upper() + sentence[1:]


def _empty_response(project_id: str) -> dict:
    return {
        "project_id": project_id,
        "recommendations": [],
        "message": EMPTY_MESSAGE,
    }


async def _source_project(user: dict, project_id: str) -> dict:
    db = get_database()
    project = await db.projects.find_one({"_id": parse_object_id(project_id, "project id")})
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project.get("researcher_id") != user["_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this project")
    return project


async def _candidate_projects(source_id) -> list[dict]:
    db = get_database()
    query = {
        "_id": {"$ne": source_id},
        "visibility": "public",
        "status": "published",
    }
    cursor = db.projects.find(query, CANDIDATE_PROJECTION)
    return [document async for document in cursor]


def _score_candidates(source_profile: dict, candidates: list[dict]) -> list[dict]:
    scored = []
    for candidate in candidates:
        candidate_profile = matching_profile(candidate)
        match = calculate_project_similarity(source_profile, candidate_profile)
        if match["similarity_score"] < SCORE_THRESHOLD:
            continue
        reason = generate_match_reason(match, source_profile, candidate_profile)
        scored.append(
            {
                "candidate": candidate,
                "profile": candidate_profile,
                **match,
                "reason": reason,
            }
        )
    scored.sort(key=lambda item: (-item["similarity_score"], stringify_id(item["candidate"]["_id"])))
    return scored


async def get_project_recommendations(user: dict, project_id: str, limit: int = 5) -> dict:
    limit = min(max(limit, 1), 20)
    source = await _source_project(user, project_id)
    source_profile = matching_profile(source)
    candidates = await _candidate_projects(source["_id"])
    ranked = _score_candidates(source_profile, candidates)[:limit]
    if not ranked:
        return _empty_response(stringify_id(source["_id"]))
    recommendations = [
        {
            "project_id": stringify_id(item["candidate"]["_id"]),
            "researcher_id": stringify_id(item["candidate"]["researcher_id"]) if item["candidate"].get("researcher_id") else "",
            "title": item["candidate"].get("title") or "",
            "domain": item["profile"].get("domain") or item["candidate"].get("research_domain") or "",
            "similarity_score": item["similarity_score"],
            "matched_fields": item["matched_fields"],
            "matched_skills": item["matched_skills"],
            "matched_technologies": item["matched_technologies"],
            "reason": item["reason"],
        }
        for item in ranked
    ]
    return {"project_id": stringify_id(source["_id"]), "recommendations": recommendations, "message": None}


async def get_researcher_recommendations(user: dict, project_id: str, limit: int = 5) -> dict:
    limit = min(max(limit, 1), 20)
    source = await _source_project(user, project_id)
    source_profile = matching_profile(source)
    candidates = [
        document
        for document in await _candidate_projects(source["_id"])
        if document.get("researcher_id") != user["_id"]
    ]
    ranked = _score_candidates(source_profile, candidates)
    if not ranked:
        return _empty_response(stringify_id(source["_id"]))

    grouped: dict = defaultdict(list)
    for item in ranked:
        grouped[item["candidate"]["researcher_id"]].append(item)

    db = get_database()
    researcher_ids = list(grouped.keys())
    users = {
        document["_id"]: document
        async for document in db.users.find(
            {"_id": {"$in": researcher_ids}, "role": "researcher", "is_active": True},
            {"name": 1, "role": 1, "is_active": 1},
        )
    }
    profiles = {
        document["user_id"]: document
        async for document in db.researchers.find(
            {"user_id": {"$in": researcher_ids}},
            {"user_id": 1, "research_domains": 1, "skills": 1},
        )
    }

    recommendations = []
    for researcher_id, items in grouped.items():
        owner = users.get(researcher_id)
        if not owner:
            continue
        items.sort(key=lambda item: -item["similarity_score"])
        best = items[0]
        profile = profiles.get(researcher_id) or {}
        skills = sorted(
            {
                *best["matched_skills"],
                *overlapping_terms(source_profile.get("skills"), profile.get("skills") or []),
            }
        )
        domain = (
            best["profile"].get("domain")
            or (profile.get("research_domains") or [None])[0]
            or best["candidate"].get("research_domain")
            or ""
        )
        recommendations.append(
            {
                "user_id": stringify_id(researcher_id),
                "name": owner.get("name") or "",
                "profile_image": "",
                "domain": domain,
                "similarity_score": best["similarity_score"],
                "matched_projects": [
                    {
                        "project_id": stringify_id(item["candidate"]["_id"]),
                        "title": item["candidate"].get("title") or "",
                        "similarity_score": item["similarity_score"],
                    }
                    for item in items[:5]
                ],
                "matched_skills": skills,
                "reason": best["reason"],
            }
        )

    recommendations.sort(key=lambda item: (-item["similarity_score"], item["name"]))
    recommendations = recommendations[:limit]
    if not recommendations:
        return _empty_response(stringify_id(source["_id"]))
    return {"project_id": stringify_id(source["_id"]), "recommendations": recommendations, "message": None}
