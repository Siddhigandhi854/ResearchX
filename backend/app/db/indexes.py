from motor.motor_asyncio import AsyncIOMotorDatabase

COLLECTION_NAMES = (
    "users",
    "researchers",
    "companies",
    "projects",
    "research_papers",
    "industry_problems",
    "matches",
    "collaboration_requests",
    "collaboration_workspaces",
    "research_notes",
    "research_resources",
    "collaboration_tasks",
    "workspace_activity",
)


async def initialize_collections(db: AsyncIOMotorDatabase) -> None:
    """Ensure core collections exist and apply lightweight indexes."""
    try:
        existing = set(await db.list_collection_names())
        for name in COLLECTION_NAMES:
            if name not in existing:
                await db.create_collection(name)

        await _ensure_unique_index(db.users, "email")
        await _ensure_unique_index(db.researchers, "user_id")
        await _ensure_unique_index(db.companies, "user_id")
        await _replace_index(db.projects, "researcher_id_1", "researcher_id")
        await db.projects.create_index("status")
        await db.projects.create_index("created_at")
        await db.projects.create_index([("researcher_id", 1), ("created_at", -1)])
        await db.projects.create_index([("visibility", 1), ("status", 1)])
        await _replace_index(db.research_papers, "project_id_1", "project_id", unique=True)
        await db.industry_problems.create_index("company_id", sparse=True)
        await db.industry_problems.create_index("status")
        await db.industry_problems.create_index("domain")
        await db.matches.create_index([("project_id", 1), ("company_id", 1)], sparse=True)
        await db.collaboration_requests.create_index("project_id", sparse=True)
        await db.collaboration_requests.create_index([("sender_id", 1), ("receiver_id", 1), ("status", 1)])
        await db.collaboration_requests.create_index([("receiver_id", 1), ("status", 1), ("created_at", -1)])
        await db.collaboration_requests.create_index([("sender_id", 1), ("created_at", -1)])
        await db.collaboration_workspaces.create_index("member_ids")
        await db.collaboration_workspaces.create_index([("project_id", 1), ("member_ids", 1)])
        await db.research_notes.create_index([("workspace_id", 1), ("created_at", -1)])
        await db.research_resources.create_index([("workspace_id", 1), ("created_at", -1)])
        await db.collaboration_tasks.create_index([("workspace_id", 1), ("status", 1)])
        await db.workspace_activity.create_index([("workspace_id", 1), ("created_at", -1)])
    except Exception as exc:
        print(f"Index initialization deferred: {exc}")




async def _ensure_unique_index(collection, field: str) -> None:
    """Create a unique index, replacing a sparse Step 1 version if needed."""
    existing = await collection.index_information()
    name = f"{field}_1"
    current = existing.get(name)
    if current and current.get("unique") and not current.get("sparse"):
        return
    if name in existing:
        await collection.drop_index(name)
    await collection.create_index(field, unique=True)


async def _replace_index(collection, name: str, field: str, unique: bool = False) -> None:
    existing = await collection.index_information()
    current = existing.get(name)
    if current and current.get("unique", False) == unique and not current.get("sparse"):
        return
    if name in existing:
        await collection.drop_index(name)
    await collection.create_index(field, unique=unique)
