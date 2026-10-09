from fastapi import HTTPException, status

from app.db.mongodb import get_database
from app.utils.datetime import utc_now
from app.utils.object_ids import parse_object_id, stringify_id
from app.utils.sanitize import sanitize_text

ACTIONS = {
    "NOTE_ADDED": "added a research note",
    "NOTE_UPDATED": "updated a research note",
    "RESOURCE_ADDED": "added a research resource",
    "TASK_CREATED": "created a task",
    "TASK_UPDATED": "updated a task",
    "TASK_COMPLETED": "completed a task",
    "MEMBER_JOINED": "joined the workspace",
}


async def _person(db, user_id, role: str = "collaborator") -> dict:
    user = await db.users.find_one({"_id": user_id}, {"name": 1})
    profile = await db.researchers.find_one({"user_id": user_id}, {"profile_image": 1})
    return {
        "id": stringify_id(user_id),
        "name": (user or {}).get("name") or "",
        "profile_image": (profile or {}).get("profile_image") or "",
        "role": role,
    }


def _member_ids(workspace: dict) -> set:
    return {member["user_id"] for member in workspace.get("members") or []}


def _is_member(workspace: dict, user_id) -> bool:
    return user_id in _member_ids(workspace)


def _is_owner(workspace: dict, user_id) -> bool:
    return workspace.get("owner_id") == user_id


async def require_workspace(user: dict, workspace_id: str) -> dict:
    db = get_database()
    workspace = await db.collaboration_workspaces.find_one({"_id": parse_object_id(workspace_id, "workspace id")})
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    if not _is_member(workspace, user["_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this workspace")
    return workspace


async def _problem_payload(db, problem_id) -> dict:
    if not problem_id:
        return {
            "id": None,
            "title": "General collaboration",
            "domain": "",
            "problem": "",
            "objectives": [],
            "methodology": "",
            "technologies": [],
        }
    problem = await db.industry_problems.find_one({"_id": problem_id})
    if not problem:
        return {
            "id": stringify_id(problem_id),
            "title": "Industry problem",
            "domain": "",
            "problem": "",
            "objectives": [],
            "methodology": "",
            "technologies": [],
        }
    return {
        "id": stringify_id(problem["_id"]),
        "title": problem.get("title") or "",
        "domain": problem.get("domain") or "",
        "problem": problem.get("statement") or "",
        "objectives": problem.get("desired_outcomes") or [],
        "methodology": "",
        "technologies": problem.get("technologies") or [],
    }


async def _topic_payload(db, workspace: dict) -> dict:
    if workspace.get("project_id"):
        return await _project_payload(db, workspace.get("project_id"))
    if workspace.get("problem_id"):
        return await _problem_payload(db, workspace.get("problem_id"))
    return await _project_payload(db, None)


async def _project_payload(db, project_id) -> dict:
    if not project_id:
        return {
            "id": None,
            "title": "General collaboration",
            "domain": "",
            "problem": "",
            "objectives": [],
            "methodology": "",
            "technologies": [],
        }
    project = await db.projects.find_one({"_id": project_id})
    if not project:
        return {
            "id": stringify_id(project_id),
            "title": "Research project",
            "domain": "",
            "problem": "",
            "objectives": [],
            "methodology": "",
            "technologies": [],
        }
    analysis = project.get("research_analysis") or {}
    return {
        "id": stringify_id(project["_id"]),
        "title": project.get("title") or "",
        "domain": analysis.get("domain") or project.get("research_domain") or "",
        "problem": analysis.get("research_problem") or project.get("problem_statement") or "",
        "objectives": analysis.get("objectives") or [],
        "methodology": analysis.get("methodology") or project.get("methodology") or "",
        "technologies": analysis.get("technologies") or project.get("technologies") or [],
    }


async def _log(db, workspace_id, actor_id, action: str, extra: str = "") -> None:
    verb = ACTIONS.get(action, action.replace("_", " ").lower())
    actor = await db.users.find_one({"_id": actor_id}, {"name": 1})
    name = (actor or {}).get("name") or "A collaborator"
    description = f"{name} {verb}"
    if extra:
        description = f"{description}: {extra}"
    await db.workspace_activity.insert_one(
        {
            "workspace_id": workspace_id,
            "actor_id": actor_id,
            "action": action,
            "description": description[:500],
            "created_at": utc_now(),
        }
    )


async def ensure_workspace_from_request(request: dict) -> dict:
    db = get_database()
    sender_id = request["sender_id"]
    receiver_id = request["receiver_id"]
    project_id = request.get("project_id")
    problem_id = request.get("problem_id")
    query = {
        "member_ids": {"$all": [sender_id, receiver_id]},
        "project_id": project_id,
        "problem_id": problem_id,
    }
    existing = await db.collaboration_workspaces.find_one(query)
    if existing:
        return existing

    now = utc_now()
    owner_id = sender_id
    if project_id:
        project = await db.projects.find_one({"_id": project_id}, {"researcher_id": 1})
        if project:
            owner_id = project["researcher_id"]
    members = [
        {"user_id": owner_id, "role": "owner", "joined_at": now},
    ]
    other = receiver_id if owner_id == sender_id else sender_id
    if other != owner_id:
        members.append({"user_id": other, "role": "collaborator", "joined_at": now})
    if sender_id not in {member["user_id"] for member in members}:
        members.append({"user_id": sender_id, "role": "collaborator", "joined_at": now})
    if receiver_id not in {member["user_id"] for member in members}:
        members.append({"user_id": receiver_id, "role": "collaborator", "joined_at": now})

    document = {
        "project_id": project_id,
        "problem_id": problem_id,
        "owner_id": owner_id,
        "members": members,
        "member_ids": [member["user_id"] for member in members],
        "status": "active",
        "request_id": request.get("_id"),
        "created_at": now,
        "updated_at": now,
    }
    result = await db.collaboration_workspaces.insert_one(document)
    created = await db.collaboration_workspaces.find_one({"_id": result.inserted_id})
    for member in members:
        await _log(db, created["_id"], member["user_id"], "MEMBER_JOINED")
    return created


async def list_workspaces(user: dict) -> dict:
    db = get_database()
    cursor = db.collaboration_workspaces.find({"member_ids": user["_id"]}).sort("updated_at", -1)
    workspaces = [document async for document in cursor]
    items = []
    for workspace in workspaces:
        project = await _topic_payload(db, workspace)
        items.append(
            {
                "id": stringify_id(workspace["_id"]),
                "title": project["title"],
                "domain": project["domain"],
                "collaborator_count": len(workspace.get("members") or []),
                "status": workspace.get("status") or "active",
                "updated_at": workspace.get("updated_at"),
            }
        )

    workspace_ids = [workspace["_id"] for workspace in workspaces]
    pending_tasks = 0
    completed_tasks = 0
    if workspace_ids:
        pending_tasks = await db.collaboration_tasks.count_documents(
            {"workspace_id": {"$in": workspace_ids}, "status": {"$in": ["todo", "in_progress"]}}
        )
        completed_tasks = await db.collaboration_tasks.count_documents(
            {"workspace_id": {"$in": workspace_ids}, "status": "completed"}
        )
    recent = []
    if workspace_ids:
        activity_cursor = db.workspace_activity.find({"workspace_id": {"$in": workspace_ids}}).sort("created_at", -1).limit(5)
        async for event in activity_cursor:
            actor = await db.users.find_one({"_id": event.get("actor_id")}, {"name": 1})
            recent.append(
                {
                    "id": stringify_id(event["_id"]),
                    "actor_name": (actor or {}).get("name") or "",
                    "action": event.get("action") or "",
                    "description": event.get("description") or "",
                    "created_at": event.get("created_at"),
                }
            )
    return {
        "items": items,
        "summary": {
            "active_workspaces": sum(1 for workspace in workspaces if workspace.get("status") == "active"),
            "pending_tasks": pending_tasks,
            "completed_tasks": completed_tasks,
            "recent_activity": recent,
        },
    }


async def get_workspace(user: dict, workspace_id: str) -> dict:
    db = get_database()
    workspace = await require_workspace(user, workspace_id)
    members = []
    for member in workspace.get("members") or []:
        person = await _person(db, member["user_id"], member.get("role") or "collaborator")
        members.append(person)
    owner = next((item for item in members if item["id"] == stringify_id(workspace["owner_id"])), members[0] if members else None)
    return {
        "id": stringify_id(workspace["_id"]),
        "project": await _topic_payload(db, workspace),
        "owner": owner or await _person(db, workspace["owner_id"], "owner"),
        "members": members,
        "status": workspace.get("status") or "active",
        "created_at": workspace.get("created_at"),
        "updated_at": workspace.get("updated_at"),
    }


async def update_workspace_status(user: dict, workspace_id: str, new_status: str) -> dict:
    workspace = await require_workspace(user, workspace_id)
    if not _is_owner(workspace, user["_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the workspace owner can change status")
    db = get_database()
    await db.collaboration_workspaces.update_one(
        {"_id": workspace["_id"]},
        {"$set": {"status": new_status, "updated_at": utc_now()}},
    )
    return await get_workspace(user, workspace_id)


async def _touch(db, workspace_id) -> None:
    await db.collaboration_workspaces.update_one({"_id": workspace_id}, {"$set": {"updated_at": utc_now()}})


def _serialize_note(note: dict, author: dict, user_id) -> dict:
    return {
        "id": stringify_id(note["_id"]),
        "author": author,
        "content": note.get("content") or "",
        "created_at": note.get("created_at"),
        "updated_at": note.get("updated_at"),
        "can_edit": note.get("author_id") == user_id,
    }


async def list_notes(user: dict, workspace_id: str) -> dict:
    workspace = await require_workspace(user, workspace_id)
    db = get_database()
    items = []
    cursor = db.research_notes.find({"workspace_id": workspace["_id"]}).sort("created_at", -1)
    async for note in cursor:
        author = await _person(db, note["author_id"])
        items.append(_serialize_note(note, author, user["_id"]))
    return {"items": items}


async def create_note(user: dict, workspace_id: str, content: str) -> dict:
    workspace = await require_workspace(user, workspace_id)
    text = sanitize_text(content, 5000)
    if not text:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Note content is required")
    db = get_database()
    now = utc_now()
    document = {
        "workspace_id": workspace["_id"],
        "author_id": user["_id"],
        "content": text,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.research_notes.insert_one(document)
    created = await db.research_notes.find_one({"_id": result.inserted_id})
    await _log(db, workspace["_id"], user["_id"], "NOTE_ADDED", text[:80])
    await _touch(db, workspace["_id"])
    return _serialize_note(created, await _person(db, user["_id"]), user["_id"])


async def update_note(user: dict, workspace_id: str, note_id: str, content: str) -> dict:
    workspace = await require_workspace(user, workspace_id)
    db = get_database()
    note = await db.research_notes.find_one(
        {"_id": parse_object_id(note_id, "note id"), "workspace_id": workspace["_id"]}
    )
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    if note.get("author_id") != user["_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own notes")
    text = sanitize_text(content, 5000)
    if not text:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Note content is required")
    await db.research_notes.update_one({"_id": note["_id"]}, {"$set": {"content": text, "updated_at": utc_now()}})
    updated = await db.research_notes.find_one({"_id": note["_id"]})
    await _log(db, workspace["_id"], user["_id"], "NOTE_UPDATED")
    await _touch(db, workspace["_id"])
    return _serialize_note(updated, await _person(db, user["_id"]), user["_id"])


async def delete_note(user: dict, workspace_id: str, note_id: str) -> dict:
    workspace = await require_workspace(user, workspace_id)
    db = get_database()
    note = await db.research_notes.find_one(
        {"_id": parse_object_id(note_id, "note id"), "workspace_id": workspace["_id"]}
    )
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    if note.get("author_id") != user["_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own notes")
    await db.research_notes.delete_one({"_id": note["_id"]})
    await _touch(db, workspace["_id"])
    return {"message": "Note deleted"}


async def list_resources(user: dict, workspace_id: str) -> dict:
    workspace = await require_workspace(user, workspace_id)
    db = get_database()
    items = []
    cursor = db.research_resources.find({"workspace_id": workspace["_id"]}).sort("created_at", -1)
    async for resource in cursor:
        added_by = await _person(db, resource["added_by"])
        items.append(
            {
                "id": stringify_id(resource["_id"]),
                "title": resource.get("title") or "",
                "url": resource.get("url") or "",
                "description": resource.get("description") or "",
                "resource_type": resource.get("resource_type") or "Other",
                "added_by": added_by,
                "created_at": resource.get("created_at"),
                "can_delete": resource.get("added_by") == user["_id"] or _is_owner(workspace, user["_id"]),
            }
        )
    return {"items": items}


async def create_resource(user: dict, workspace_id: str, payload) -> dict:
    workspace = await require_workspace(user, workspace_id)
    db = get_database()
    now = utc_now()
    document = {
        "workspace_id": workspace["_id"],
        "added_by": user["_id"],
        "title": sanitize_text(payload.title, 240),
        "url": payload.url,
        "description": sanitize_text(payload.description, 1000),
        "resource_type": payload.resource_type,
        "created_at": now,
    }
    result = await db.research_resources.insert_one(document)
    created = await db.research_resources.find_one({"_id": result.inserted_id})
    await _log(db, workspace["_id"], user["_id"], "RESOURCE_ADDED", created["title"])
    await _touch(db, workspace["_id"])
    added_by = await _person(db, user["_id"])
    return {
        "id": stringify_id(created["_id"]),
        "title": created["title"],
        "url": created["url"],
        "description": created.get("description") or "",
        "resource_type": created["resource_type"],
        "added_by": added_by,
        "created_at": created.get("created_at"),
        "can_delete": True,
    }


async def delete_resource(user: dict, workspace_id: str, resource_id: str) -> dict:
    workspace = await require_workspace(user, workspace_id)
    db = get_database()
    resource = await db.research_resources.find_one(
        {"_id": parse_object_id(resource_id, "resource id"), "workspace_id": workspace["_id"]}
    )
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")
    if resource.get("added_by") != user["_id"] and not _is_owner(workspace, user["_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot delete this resource")
    await db.research_resources.delete_one({"_id": resource["_id"]})
    await _touch(db, workspace["_id"])
    return {"message": "Resource deleted"}


def _serialize_task(task: dict, assigned, created_by) -> dict:
    return {
        "id": stringify_id(task["_id"]),
        "title": task.get("title") or "",
        "description": task.get("description") or "",
        "assigned_to": assigned,
        "created_by": created_by,
        "status": task.get("status") or "todo",
        "due_date": task.get("due_date"),
        "created_at": task.get("created_at"),
        "updated_at": task.get("updated_at"),
    }


async def _assigned_member(workspace: dict, assigned_to: str | None):
    if not assigned_to:
        return None, None
    oid = parse_object_id(assigned_to, "assignee id")
    if oid not in _member_ids(workspace):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assignee must be a workspace member")
    return oid, None


async def list_tasks(user: dict, workspace_id: str) -> dict:
    workspace = await require_workspace(user, workspace_id)
    db = get_database()
    items = []
    cursor = db.collaboration_tasks.find({"workspace_id": workspace["_id"]}).sort("created_at", -1)
    async for task in cursor:
        assigned = await _person(db, task["assigned_to"]) if task.get("assigned_to") else None
        created_by = await _person(db, task["created_by"])
        items.append(_serialize_task(task, assigned, created_by))
    return {"items": items}


async def create_task(user: dict, workspace_id: str, payload) -> dict:
    workspace = await require_workspace(user, workspace_id)
    assigned_id, _ = await _assigned_member(workspace, payload.assigned_to)
    db = get_database()
    now = utc_now()
    document = {
        "workspace_id": workspace["_id"],
        "title": sanitize_text(payload.title, 240),
        "description": sanitize_text(payload.description, 2000),
        "assigned_to": assigned_id,
        "created_by": user["_id"],
        "status": "todo",
        "due_date": payload.due_date,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.collaboration_tasks.insert_one(document)
    created = await db.collaboration_tasks.find_one({"_id": result.inserted_id})
    await _log(db, workspace["_id"], user["_id"], "TASK_CREATED", created["title"])
    await _touch(db, workspace["_id"])
    assigned = await _person(db, assigned_id) if assigned_id else None
    return _serialize_task(created, assigned, await _person(db, user["_id"]))


async def update_task(user: dict, workspace_id: str, task_id: str, payload) -> dict:
    workspace = await require_workspace(user, workspace_id)
    db = get_database()
    task = await db.collaboration_tasks.find_one(
        {"_id": parse_object_id(task_id, "task id"), "workspace_id": workspace["_id"]}
    )
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    updates = payload.model_dump(exclude_unset=True)
    if "assigned_to" in updates:
        assigned_id, _ = await _assigned_member(workspace, updates.get("assigned_to"))
        updates["assigned_to"] = assigned_id
    if "title" in updates and updates["title"] is not None:
        updates["title"] = sanitize_text(updates["title"], 240)
    if "description" in updates and updates["description"] is not None:
        updates["description"] = sanitize_text(updates["description"], 2000)
    updates["updated_at"] = utc_now()
    await db.collaboration_tasks.update_one({"_id": task["_id"]}, {"$set": updates})
    updated = await db.collaboration_tasks.find_one({"_id": task["_id"]})
    action = "TASK_COMPLETED" if updates.get("status") == "completed" else "TASK_UPDATED"
    await _log(db, workspace["_id"], user["_id"], action, updated.get("title") or "")
    await _touch(db, workspace["_id"])
    assigned = await _person(db, updated["assigned_to"]) if updated.get("assigned_to") else None
    return _serialize_task(updated, assigned, await _person(db, updated["created_by"]))


async def delete_task(user: dict, workspace_id: str, task_id: str) -> dict:
    workspace = await require_workspace(user, workspace_id)
    db = get_database()
    task = await db.collaboration_tasks.find_one(
        {"_id": parse_object_id(task_id, "task id"), "workspace_id": workspace["_id"]}
    )
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    if task.get("created_by") != user["_id"] and not _is_owner(workspace, user["_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot delete this task")
    await db.collaboration_tasks.delete_one({"_id": task["_id"]})
    await _touch(db, workspace["_id"])
    return {"message": "Task deleted"}


async def list_activity(user: dict, workspace_id: str) -> dict:
    workspace = await require_workspace(user, workspace_id)
    db = get_database()
    items = []
    cursor = db.workspace_activity.find({"workspace_id": workspace["_id"]}).sort("created_at", -1).limit(50)
    async for event in cursor:
        actor = await db.users.find_one({"_id": event.get("actor_id")}, {"name": 1})
        items.append(
            {
                "id": stringify_id(event["_id"]),
                "actor_name": (actor or {}).get("name") or "",
                "action": event.get("action") or "",
                "description": event.get("description") or "",
                "created_at": event.get("created_at"),
            }
        )
    return {"items": items}
