"""Optional demo project for local development.

Windows PowerShell:

  cd backend
  .\\.venv\\Scripts\\Activate.ps1
  $env:DEMO_RESEARCHER_EMAIL="your-researcher@example.com"
  python seed_demo_project.py
"""

import os
import sys

from pymongo import MongoClient

from app.core.config import get_settings
from app.utils.datetime import utc_now


def main() -> int:
    email = (os.getenv("DEMO_RESEARCHER_EMAIL") or "").strip().lower()
    if not email:
        print("Set DEMO_RESEARCHER_EMAIL to an existing researcher account.")
        return 1

    settings = get_settings()
    client = MongoClient(settings.mongodb_uri)
    db = client[settings.mongodb_database]
    user = db.users.find_one({"email": email, "role": "researcher"})
    if not user:
        print(f"No researcher account found for {email}")
        client.close()
        return 1

    now = utc_now()
    title = "Deep Learning Based Manufacturing Defect Detection"
    existing = db.projects.find_one({"researcher_id": user["_id"], "title": title})
    if existing:
        print("Demo project already exists.")
        client.close()
        return 0

    db.projects.insert_one(
        {
            "researcher_id": user["_id"],
            "title": title,
            "problem_statement": "Manufacturing lines miss surface defects that lead to scrap and warranty claims.",
            "proposed_solution": "A convolutional neural network inspects product images in real time and flags defects.",
            "research_domain": "Computer Vision",
            "technologies": ["Python", "CNN", "TensorFlow"],
            "methodology": "Supervised training on annotated defect images with transfer learning from a ResNet backbone.",
            "results": "Initial prototype reaches high recall on a held-out factory image set.",
            "prototype_status": "Prototype",
            "industry_applications": ["Manufacturing", "Automotive"],
            "github_url": "",
            "demo_url": "",
            "research_interests": ["computer vision", "quality inspection"],
            "status": "draft",
            "visibility": "public",
            "ai_analysis_status": "not_analyzed",
            "ai_summary": None,
            "created_at": now,
            "updated_at": now,
        }
    )
    client.close()
    print("Demo project created.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
