import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";
import { Field, TextArea, TextInput, joinList, splitList } from "../components/FormFields.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getApiError } from "../services/api.js";
import { getCompanyProfile, updateCompanyProfile } from "../services/authService.js";

export default function CorporatePage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    company_name: "",
    industry: "",
    description: "",
    website: "",
    location: "",
    requirements: "",
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCompanyProfile()
      .then((profile) => {
        setForm({
          company_name: profile.company_name || "",
          industry: profile.industry || "",
          description: profile.description || "",
          website: profile.website || "",
          location: profile.location || "",
          requirements: joinList(profile.requirements),
        });
      })
      .catch((err) => setError(getApiError(err, "Unable to load company profile.")))
      .finally(() => setLoading(false));
  }, []);

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setStatus("");
    try {
      await updateCompanyProfile({
        company_name: form.company_name,
        industry: form.industry,
        description: form.description,
        website: form.website,
        location: form.location,
        requirements: splitList(form.requirements),
      });
      setStatus("Profile saved.");
    } catch (err) {
      setError(getApiError(err, "Unable to save profile."));
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-line bg-card p-8 shadow-sm">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-soft text-navy">
          <Building2 size={22} />
        </div>
        <h1 className="font-serif text-3xl font-semibold text-navy">Corporate R&amp;D Dashboard</h1>
        <p className="mt-2 text-muted">Welcome, {user?.name}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/researchers"
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark"
          >
            Find researchers
          </Link>
          <Link
            to="/problems"
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-navy hover:bg-blue-soft"
          >
            Problem statements
          </Link>
          <Link
            to="/collaborations"
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-navy hover:bg-blue-soft"
          >
            Collaborations
          </Link>
          <Link
            to="/workspaces"
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-navy hover:bg-blue-soft"
          >
            Workspaces
          </Link>
        </div>
        {loading ? (
          <p className="mt-6 text-sm text-muted">Loading profile…</p>
        ) : (
          <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
            <Field label="Company name">
              <TextInput value={form.company_name} onChange={update("company_name")} />
            </Field>
            <Field label="Industry">
              <TextInput value={form.industry} onChange={update("industry")} />
            </Field>
            <Field label="Description">
              <TextArea rows={4} value={form.description} onChange={update("description")} />
            </Field>
            <Field label="Website">
              <TextInput value={form.website} onChange={update("website")} />
            </Field>
            <Field label="Location">
              <TextInput value={form.location} onChange={update("location")} />
            </Field>
            <Field label="Requirements (comma-separated)">
              <TextInput value={form.requirements} onChange={update("requirements")} />
            </Field>
            {error && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</p>}
            {status && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{status}</p>}
            <button type="submit" className="rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-dark">
              Save profile
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
