import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ProjectForm, { emptyProjectForm, formToPayload, projectToForm, validateProjectForm } from "../components/ProjectForm.jsx";
import { getApiError } from "../services/api.js";
import { getProject, updateProject } from "../services/projectService.js";

export default function ProjectEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyProjectForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProject(id)
      .then((project) => setForm(projectToForm(project)))
      .catch((err) => setError(getApiError(err, "Unable to load project.")))
      .finally(() => setLoading(false));
  }, [id]);

  const save = async () => {
    const validation = validateProjectForm(form);
    if (validation) {
      setError(validation);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateProject(id, formToPayload(form));
      navigate(`/researcher/projects/${id}`);
    } catch (err) {
      setError(getApiError(err, "Unable to save the project."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold text-navy">Edit project</h1>
      {loading ? (
        <p className="mt-6 text-sm text-muted">Loading project…</p>
      ) : (
        <div className="mt-8 rounded-2xl border border-line bg-card p-8 shadow-sm">
          <ProjectForm form={form} setForm={setForm} error={error}>
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </ProjectForm>
        </div>
      )}
    </div>
  );
}
