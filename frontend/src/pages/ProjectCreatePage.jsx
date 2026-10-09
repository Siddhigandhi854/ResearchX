import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProjectForm, { emptyProjectForm, formToPayload, validateProjectForm } from "../components/ProjectForm.jsx";
import { getApiError } from "../services/api.js";
import { createProject } from "../services/projectService.js";

export default function ProjectCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyProjectForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (goToDetails) => {
    const validation = validateProjectForm(form);
    if (validation) {
      setError(validation);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const created = await createProject(formToPayload(form));
      navigate(goToDetails ? `/researcher/projects/${created.id}` : "/researcher/projects");
    } catch (err) {
      setError(getApiError(err, "Unable to create the project."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold text-navy">Create project</h1>
      <p className="mt-2 text-sm text-muted">Save a draft now. Publish when the project is ready for discovery.</p>
      <div className="mt-8 rounded-2xl border border-line bg-card p-8 shadow-sm">
        <ProjectForm form={form} setForm={setForm} error={error}>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => save(false)}
              className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-navy hover:bg-blue-soft disabled:opacity-60"
            >
              Save draft
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => save(true)}
              className="rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
            >
              {saving ? "Saving…" : "Create project"}
            </button>
          </div>
        </ProjectForm>
      </div>
    </div>
  );
}
