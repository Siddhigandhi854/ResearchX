import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getApiError } from "../services/api.js";
import {
  createNote,
  createResource,
  createTask,
  deleteNote,
  deleteResource,
  deleteTask,
  getWorkspace,
  listActivity,
  listNotes,
  listResources,
  listTasks,
  updateNote,
  updateTask,
  updateWorkspaceStatus,
} from "../services/workspaceService.js";

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

const RESOURCE_TYPES = ["Paper", "Dataset", "GitHub", "Documentation", "Article", "Other"];
const COLUMNS = [
  { id: "todo", label: "TODO" },
  { id: "in_progress", label: "IN PROGRESS" },
  { id: "completed", label: "COMPLETED" },
];

export default function WorkspaceDetailPage() {
  const { workspaceId } = useParams();
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [notes, setNotes] = useState([]);
  const [resources, setResources] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [noteText, setNoteText] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [resourceForm, setResourceForm] = useState({
    title: "",
    url: "",
    description: "",
    resource_type: "Paper",
  });
  const [taskForm, setTaskForm] = useState({ title: "", description: "", assigned_to: "", due_date: "" });
  const [saving, setSaving] = useState("");

  const load = async () => {
    const [space, noteData, resourceData, taskData, activityData] = await Promise.all([
      getWorkspace(workspaceId),
      listNotes(workspaceId),
      listResources(workspaceId),
      listTasks(workspaceId),
      listActivity(workspaceId),
    ]);
    setWorkspace(space);
    setNotes(noteData.items || []);
    setResources(resourceData.items || []);
    setTasks(taskData.items || []);
    setActivity(activityData.items || []);
  };

  useEffect(() => {
    setLoading(true);
    load()
      .catch((err) => setError(getApiError(err, "Unable to load workspace.")))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const run = async (label, action) => {
    setError("");
    setSaving(label);
    try {
      await action();
      await load();
    } catch (err) {
      setError(getApiError(err, "Unable to update the workspace."));
    } finally {
      setSaving("");
    }
  };

  if (loading) return <p className="mx-auto max-w-6xl px-4 py-12 text-sm text-muted">Loading workspace...</p>;
  if (!workspace) {
    return <p className="mx-auto max-w-6xl px-4 py-12 text-sm text-amber-900">{error || "Workspace not found."}</p>;
  }

  const isOwner = workspace.owner?.id === user?.id;
  const project = workspace.project || {};

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {error && <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</p>}
      <div className="rounded-2xl border border-line bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue">{workspace.status}</p>
            <h1 className="mt-2 font-serif text-3xl font-semibold text-navy">{project.title}</h1>
            <p className="mt-1 text-sm text-muted">{project.domain || "Domain not specified"}</p>
          </div>
          {isOwner && (
            <select
              value={workspace.status}
              onChange={(event) => run("status", () => updateWorkspaceStatus(workspaceId, event.target.value))}
              className="rounded-lg border border-line px-3 py-2 text-sm"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          )}
        </div>
      </div>

      <section className="mt-5 rounded-2xl border border-line bg-card p-6">
        <h2 className="font-serif text-lg font-semibold text-navy">Collaborators</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {workspace.members.map((member) => (
            <span key={member.id} className="rounded-full bg-blue-soft px-3 py-1 text-xs text-navy">
              {member.name} · {member.role}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-line bg-card p-6">
        <h2 className="font-serif text-lg font-semibold text-navy">Research Overview</h2>
        <div className="mt-4 grid gap-4 text-sm text-muted">
          <p>
            <span className="font-semibold text-navy">Problem. </span>
            {project.problem || "Not provided yet."}
          </p>
          <div>
            <p className="font-semibold text-navy">Objectives</p>
            {(project.objectives || []).length === 0 ? (
              <p className="mt-1">Not provided yet.</p>
            ) : (
              <ul className="mt-1 list-disc pl-5">
                {project.objectives.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </div>
          <p>
            <span className="font-semibold text-navy">Methodology. </span>
            {project.methodology || "Not provided yet."}
          </p>
          <div className="flex flex-wrap gap-2">
            {(project.technologies || []).map((item) => (
              <span key={item} className="rounded-full bg-blue-soft px-3 py-1 text-xs text-navy">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-line bg-card p-6">
        <h2 className="font-serif text-lg font-semibold text-navy">Research Notes</h2>
        <form
          className="mt-4"
          onSubmit={(event) => {
            event.preventDefault();
            run("note", async () => {
              await createNote(workspaceId, noteText);
              setNoteText("");
            });
          }}
        >
          <textarea
            value={noteText}
            onChange={(event) => setNoteText(event.target.value)}
            placeholder="Write a research note..."
            maxLength={5000}
            rows={3}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-blue"
          />
          <button
            type="submit"
            disabled={saving === "note"}
            className="mt-2 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
          >
            {saving === "note" ? "Saving..." : "Add Note"}
          </button>
        </form>
        {notes.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No research notes yet.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {notes.map((note) => (
              <article key={note.id} className="rounded-xl border border-line bg-surface p-4">
                <p className="text-sm font-semibold text-navy">{note.author.name}</p>
                <p className="text-xs text-muted">{formatDate(note.created_at)}</p>
                {editingNote === note.id ? (
                  <form
                    className="mt-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const content = event.target.content.value;
                      run("edit-note", async () => {
                        await updateNote(workspaceId, note.id, content);
                        setEditingNote(null);
                      });
                    }}
                  >
                    <textarea name="content" defaultValue={note.content} rows={3} className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
                    <button type="submit" className="mt-2 rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white">
                      Save
                    </button>
                  </form>
                ) : (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{note.content}</p>
                )}
                {note.can_edit && (
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => setEditingNote(note.id)} className="text-xs font-medium text-navy hover:underline">
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => run("delete-note", () => deleteNote(workspaceId, note.id))}
                      className="text-xs font-medium text-red-700 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-5 rounded-2xl border border-line bg-card p-6">
        <h2 className="font-serif text-lg font-semibold text-navy">Resources</h2>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            run("resource", async () => {
              await createResource(workspaceId, resourceForm);
              setResourceForm({ title: "", url: "", description: "", resource_type: "Paper" });
            });
          }}
        >
          <input
            required
            placeholder="Title"
            value={resourceForm.title}
            onChange={(event) => setResourceForm((c) => ({ ...c, title: event.target.value }))}
            className="rounded-lg border border-line px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="https://"
            value={resourceForm.url}
            onChange={(event) => setResourceForm((c) => ({ ...c, url: event.target.value }))}
            className="rounded-lg border border-line px-3 py-2 text-sm"
          />
          <select
            value={resourceForm.resource_type}
            onChange={(event) => setResourceForm((c) => ({ ...c, resource_type: event.target.value }))}
            className="rounded-lg border border-line px-3 py-2 text-sm"
          >
            {RESOURCE_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
          <input
            placeholder="Short description"
            value={resourceForm.description}
            onChange={(event) => setResourceForm((c) => ({ ...c, description: event.target.value }))}
            className="rounded-lg border border-line px-3 py-2 text-sm"
          />
          <button type="submit" disabled={saving === "resource"} className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white sm:col-span-2">
            {saving === "resource" ? "Saving..." : "Add resource"}
          </button>
        </form>
        {resources.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No resources yet.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {resources.map((resource) => (
              <article key={resource.id} className="rounded-xl border border-line bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue">{resource.resource_type}</p>
                <h3 className="mt-1 font-semibold text-navy">{resource.title}</h3>
                <p className="mt-1 text-sm text-muted">{resource.description || "No description."}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-navy hover:bg-blue-soft"
                  >
                    Open Resource
                  </a>
                  {resource.can_delete && (
                    <button
                      type="button"
                      onClick={() => run("delete-resource", () => deleteResource(workspaceId, resource.id))}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-red-700"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-5 rounded-2xl border border-line bg-card p-6">
        <h2 className="font-serif text-lg font-semibold text-navy">Tasks</h2>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            run("task", async () => {
              await createTask(workspaceId, {
                title: taskForm.title,
                description: taskForm.description,
                assigned_to: taskForm.assigned_to || null,
                due_date: taskForm.due_date ? new Date(taskForm.due_date).toISOString() : null,
              });
              setTaskForm({ title: "", description: "", assigned_to: "", due_date: "" });
            });
          }}
        >
          <input
            required
            placeholder="Task title"
            value={taskForm.title}
            onChange={(event) => setTaskForm((c) => ({ ...c, title: event.target.value }))}
            className="rounded-lg border border-line px-3 py-2 text-sm"
          />
          <select
            value={taskForm.assigned_to}
            onChange={(event) => setTaskForm((c) => ({ ...c, assigned_to: event.target.value }))}
            className="rounded-lg border border-line px-3 py-2 text-sm"
          >
            <option value="">Unassigned</option>
            {workspace.members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
          <input
            placeholder="Description"
            value={taskForm.description}
            onChange={(event) => setTaskForm((c) => ({ ...c, description: event.target.value }))}
            className="rounded-lg border border-line px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={taskForm.due_date}
            onChange={(event) => setTaskForm((c) => ({ ...c, due_date: event.target.value }))}
            className="rounded-lg border border-line px-3 py-2 text-sm"
          />
          <button type="submit" disabled={saving === "task"} className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white sm:col-span-2">
            {saving === "task" ? "Saving..." : "Add task"}
          </button>
        </form>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {COLUMNS.map((column) => (
            <div key={column.id} className="rounded-xl border border-line bg-surface p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-navy">{column.label}</h3>
              <div className="mt-3 grid gap-3">
                {tasks
                  .filter((task) => task.status === column.id)
                  .map((task) => (
                    <article key={task.id} className="rounded-lg border border-line bg-white p-3">
                      <p className="text-sm font-semibold text-navy">{task.title}</p>
                      <p className="mt-1 text-xs text-muted">{task.description}</p>
                      <p className="mt-2 text-xs text-muted">Assigned to: {task.assigned_to?.name || "Unassigned"}</p>
                      {task.due_date && <p className="text-xs text-muted">Due: {formatDate(task.due_date)}</p>}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {COLUMNS.filter((item) => item.id !== task.status).map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => run("task-status", () => updateTask(workspaceId, task.id, { status: item.id }))}
                            className="rounded border border-line px-2 py-1 text-[10px] text-navy"
                          >
                            {item.label}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => run("delete-task", () => deleteTask(workspaceId, task.id))}
                          className="rounded border border-line px-2 py-1 text-[10px] text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-line bg-card p-6">
        <h2 className="font-serif text-lg font-semibold text-navy">Activity</h2>
        {activity.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No activity yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {activity.map((item) => (
              <li key={item.id}>
                {item.description}
                <span className="ml-2 text-xs">{formatDate(item.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
