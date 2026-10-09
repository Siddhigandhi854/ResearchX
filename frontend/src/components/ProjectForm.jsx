import { Field, TextArea, TextInput } from "./FormFields.jsx";
import ChipInput from "./ChipInput.jsx";

export const PROTOTYPE_STATUSES = [
  "Research",
  "Concept",
  "Proof of Concept",
  "Prototype",
  "Pilot",
  "Industry Ready",
];

export const emptyProjectForm = {
  title: "",
  research_domain: "",
  research_interests: [],
  problem_statement: "",
  proposed_solution: "",
  methodology: "",
  results: "",
  technologies: [],
  industry_applications: [],
  prototype_status: "Research",
  github_url: "",
  demo_url: "",
};

export function projectToForm(project) {
  return {
    title: project.title || "",
    research_domain: project.research_domain || "",
    research_interests: project.research_interests || [],
    problem_statement: project.problem_statement || "",
    proposed_solution: project.proposed_solution || "",
    methodology: project.methodology || "",
    results: project.results || "",
    technologies: project.technologies || [],
    industry_applications: project.industry_applications || [],
    prototype_status: project.prototype_status || "Research",
    github_url: project.github_url || "",
    demo_url: project.demo_url || "",
  };
}

export function formToPayload(form) {
  return {
    title: form.title.trim(),
    research_domain: form.research_domain.trim(),
    research_interests: form.research_interests,
    problem_statement: form.problem_statement.trim(),
    proposed_solution: form.proposed_solution.trim(),
    methodology: form.methodology.trim(),
    results: form.results.trim(),
    technologies: form.technologies,
    industry_applications: form.industry_applications,
    prototype_status: form.prototype_status,
    github_url: form.github_url.trim(),
    demo_url: form.demo_url.trim(),
  };
}

export function validateProjectForm(form) {
  if (!form.title.trim() || !form.problem_statement.trim() || !form.proposed_solution.trim() || !form.research_domain.trim()) {
    return "Title, research domain, problem statement, and proposed solution are required.";
  }
  return "";
}

export default function ProjectForm({ form, setForm, error, children }) {
  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-serif text-xl font-semibold text-navy">Basic information</h2>
        <div className="mt-4 grid gap-4">
          <Field label="Project title">
            <TextInput value={form.title} onChange={update("title")} />
          </Field>
          <Field label="Research domain">
            <TextInput value={form.research_domain} onChange={update("research_domain")} placeholder="Computer Vision" />
          </Field>
          <div>
            <p className="text-sm font-medium text-ink">Research interests</p>
            <ChipInput
              values={form.research_interests}
              onChange={(research_interests) => setForm((current) => ({ ...current, research_interests }))}
              placeholder="Add an interest"
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-navy">Research</h2>
        <div className="mt-4 grid gap-4">
          <Field label="Problem statement">
            <TextArea rows={4} value={form.problem_statement} onChange={update("problem_statement")} />
          </Field>
          <Field label="Proposed solution">
            <TextArea rows={4} value={form.proposed_solution} onChange={update("proposed_solution")} />
          </Field>
          <Field label="Methodology">
            <TextArea rows={4} value={form.methodology} onChange={update("methodology")} />
          </Field>
          <Field label="Results">
            <TextArea rows={4} value={form.results} onChange={update("results")} />
          </Field>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-navy">Technology</h2>
        <div className="mt-4">
          <p className="text-sm font-medium text-ink">Technologies</p>
          <ChipInput
            values={form.technologies}
            onChange={(technologies) => setForm((current) => ({ ...current, technologies }))}
            placeholder="Python, TensorFlow, CNN"
          />
        </div>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-navy">Industry application</h2>
        <div className="mt-4">
          <p className="text-sm font-medium text-ink">Industry applications</p>
          <ChipInput
            values={form.industry_applications}
            onChange={(industry_applications) => setForm((current) => ({ ...current, industry_applications }))}
            placeholder="Manufacturing, Automotive"
          />
        </div>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-navy">Prototype</h2>
        <label className="mt-4 block text-sm font-medium text-ink">
          Prototype status
          <select
            value={form.prototype_status}
            onChange={update("prototype_status")}
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-blue"
          >
            {PROTOTYPE_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-navy">Links</h2>
        <div className="mt-4 grid gap-4">
          <Field label="GitHub URL">
            <TextInput value={form.github_url} onChange={update("github_url")} placeholder="https://github.com/..." />
          </Field>
          <Field label="Demo URL">
            <TextInput value={form.demo_url} onChange={update("demo_url")} placeholder="https://..." />
          </Field>
        </div>
      </section>

      {error && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</p>}
      {children}
    </div>
  );
}
