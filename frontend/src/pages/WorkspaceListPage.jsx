import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getApiError } from "../services/api.js";
import { listWorkspaces } from "../services/workspaceService.js";

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

export default function WorkspaceListPage() {
  const [data, setData] = useState({ items: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listWorkspaces()
      .then(setData)
      .catch((err) => setError(getApiError(err, "Unable to load workspaces.")))
      .finally(() => setLoading(false));
  }, []);

  const summary = data.summary || {};

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold text-navy">Workspaces</h1>
      <p className="mt-2 text-sm text-muted">Private collaboration spaces created after a request is accepted.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Active Workspaces", summary.active_workspaces ?? 0],
          ["Pending Tasks", summary.pending_tasks ?? 0],
          ["Completed Tasks", summary.completed_tasks ?? 0],
          ["Recent Activity", (summary.recent_activity || []).length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-line bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
            <p className="mt-2 font-serif text-3xl text-navy">{value}</p>
          </div>
        ))}
      </div>

      {summary.recent_activity?.length > 0 && (
        <div className="mt-6 rounded-2xl border border-line bg-card p-5">
          <h2 className="font-serif text-lg font-semibold text-navy">Recent Activity</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {summary.recent_activity.map((item) => (
              <li key={item.id}>
                {item.description} · {formatDate(item.created_at)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</p>}
      {loading ? (
        <p className="mt-6 text-sm text-muted">Loading workspaces...</p>
      ) : data.items.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No workspaces yet. Accept a collaboration request to create one.</p>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {data.items.map((workspace) => (
            <article key={workspace.id} className="rounded-2xl border border-line bg-card p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-serif text-xl font-semibold text-navy">{workspace.title}</h2>
                <span className="rounded-full bg-blue-soft px-3 py-1 text-xs font-medium capitalize text-navy">
                  {workspace.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">{workspace.domain || "Domain not specified"}</p>
              <p className="mt-2 text-sm text-muted">{workspace.collaborator_count} collaborators</p>
              <p className="mt-1 text-xs text-muted">Last updated {formatDate(workspace.updated_at)}</p>
              <Link
                to={`/workspaces/${workspace.id}`}
                className="mt-4 inline-block rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark"
              >
                Open Workspace
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
