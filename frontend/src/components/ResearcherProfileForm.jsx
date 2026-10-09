import { useState } from "react";
import ChipInput from "./ChipInput.jsx";
import { Field, TextArea, TextInput } from "./FormFields.jsx";

const EMPTY = {
  university: "",
  department: "",
  bio: "",
  research_interests: [],
  skills: [],
  technologies: [],
  research_domains: [],
  publications: [],
  patents: [],
  profile_image: "",
  portfolio_url: "",
  linkedin_url: "",
  github_url: "",
  visibility: "public",
};

export default function ResearcherProfileForm({ initial, onSubmit, saving, error, status }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial });

  const set = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      university: form.university,
      department: form.department,
      bio: form.bio,
      research_interests: form.research_interests,
      skills: form.skills,
      technologies: form.technologies,
      research_domains: form.research_domains,
      publications: form.publications,
      patents: form.patents,
      profile_image: form.profile_image,
      portfolio_url: form.portfolio_url,
      linkedin_url: form.linkedin_url,
      github_url: form.github_url,
      visibility: form.visibility,
    });
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <Field label="Institution">
        <TextInput value={form.university} onChange={set("university")} />
      </Field>
      <Field label="Department">
        <TextInput value={form.department} onChange={set("department")} />
      </Field>
      <Field label="Bio">
        <TextArea rows={4} value={form.bio} onChange={set("bio")} maxLength={2000} />
      </Field>
      <div>
        <p className="text-sm font-medium text-ink">Research interests</p>
        <ChipInput values={form.research_interests} onChange={(research_interests) => setForm((c) => ({ ...c, research_interests }))} placeholder="Add an interest" />
      </div>
      <div>
        <p className="text-sm font-medium text-ink">Skills</p>
        <ChipInput values={form.skills} onChange={(skills) => setForm((c) => ({ ...c, skills }))} placeholder="Add a skill" />
      </div>
      <div>
        <p className="text-sm font-medium text-ink">Technologies</p>
        <ChipInput values={form.technologies} onChange={(technologies) => setForm((c) => ({ ...c, technologies }))} placeholder="Add a technology" />
      </div>
      <div>
        <p className="text-sm font-medium text-ink">Research domains</p>
        <ChipInput values={form.research_domains} onChange={(research_domains) => setForm((c) => ({ ...c, research_domains }))} placeholder="Add a domain" />
      </div>
      <Field label="Profile image URL">
        <TextInput value={form.profile_image} onChange={set("profile_image")} placeholder="https://" />
      </Field>
      <Field label="Portfolio URL">
        <TextInput value={form.portfolio_url} onChange={set("portfolio_url")} placeholder="https://" />
      </Field>
      <Field label="LinkedIn URL">
        <TextInput value={form.linkedin_url} onChange={set("linkedin_url")} placeholder="https://" />
      </Field>
      <Field label="GitHub URL">
        <TextInput value={form.github_url} onChange={set("github_url")} placeholder="https://" />
      </Field>
      <Field label="Profile visibility">
        <select
          value={form.visibility}
          onChange={set("visibility")}
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-blue"
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
      </Field>
      {error && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</p>}
      {status && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{status}</p>}
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
