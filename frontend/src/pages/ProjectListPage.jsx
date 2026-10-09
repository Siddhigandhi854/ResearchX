import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FolderKanban, Plus } from "lucide-react";
import { getApiError } from "../services/api.js";
import { archiveProject, deleteProject, getMyProjects, publishProject } from "../services/projectService.js";

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString();
}

export default function ProjectListPage() {
  const [data, setData] = useState({ items: [], page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = (page = 1) => {
    setLoading(true);
    getMyProjects(page, 10)
      .then(setData)
      .catch((err) => setError(getApiError(err, "Unable to load projects.")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(1);
  }, []);

  const run = async (action, id) => {
    setError("");
    try {
      await action(id);
      load(data.page);
    } catch (err) {
      setError(getApiError(err, "Unable to update the project."));
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-navy">Projects</h1>
          <p className="mt-1 text-sm text-muted">Create, publish, and manage your research projects.</p>
        </div>
        <Link
          to="/researcher/projects/new"
          className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-dark"
        >
          <Plus size={16} />
          New project
        </Link>
      </div>

      {error && <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</p>}
      {loading ? (
        <p className="text-sm text-muted">Loading projects…</p>
      ) : data.items.length === 0 ? (
        <div className="rounded-2xl border border-line bg-card p-10 text-center">
          <FolderKanban className="mx-auto text-navy" size={28} />
          <p className="mt-3 text-muted">No projects yet. Create your first research project.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {data.items.map((project) => (
            <article key={project.id} className="rounded-2xl border border-line bg-card p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-serif text-xl font-semibold text-navy">{project.title}</h2>
                <span className="rounded-full bg-blue-soft px-2.5 py-1 text-xs font-medium capitalize text-navy">
                  {project.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">{project.research_domain}</p>
              <p className="mt-3 text-xs text-muted">
                Prototype: {project.prototype_status} · Created {formatDate(project.created_at)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {project.technologies.slice(0, 4).map((tech) => (
                  <span key={tech} className="rounded-full bg-surface px-2 py-1 text-xs text-navy">
                    {tech}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted">
                Paper: {project.has_paper ? project.paper_filename || "Uploaded" : "Not uploaded"}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link to={`/researcher/projects/${project.id}`} className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-navy hover:bg-blue-soft">
                  View
                </Link>
                <Link to={`/researcher/projects/${project.id}/edit`} className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-navy hover:bg-blue-soft">
                  Edit
                </Link>
                {project.status === "draft" && (
                  <button type="button" onClick={() => run(publishProject, project.id)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-navy hover:bg-blue-soft">
                    Publish
                  </button>
                )}
                {project.status === "published" && (
                  <button type="button" onClick={() => run(archiveProject, project.id)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-navy hover:bg-blue-soft">
                    Archive
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Delete this project and its research paper?")) {
                      run(deleteProject, project.id);
                    }
                  }}
                  className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
