import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ChipInput from "../components/ChipInput.jsx";
import { Field, TextArea, TextInput } from "../components/FormFields.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getApiError } from "../services/api.js";
import {
  closeProblem,
  createProblem,
  deleteProblem,
  listMyProblems,
  listOpenProblems,
  publishProblem,
} from "../services/problemService.js";

const emptyForm = {
  title: "",
  domain: "",
  statement: "",
  desired_outcomes: [],
  technologies: [],
};

export default function ProblemsPage() {
  const { user } = useAuth();
  const isCorporate = user?.role === "corporate";
  const [domain, setDomain] = useState("");
  const [query, setQuery] = useState("");
  const [data, setData] = useState({ items: [], total: 0 });
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const result = isCorporate ? await listMyProblems(1, 48) : await listOpenProblems(1, 48, query);
      setData(result);
    } catch (err) {
      setError(getApiError(err, "Unable to load problem statements."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [isCorporate, query]);

  const submitProblem = async (event) => {
    event.preventDefault();
    setError("");
    setStatus("");
    try {
      await createProblem(form);
      setForm(emptyForm);
      setStatus("Problem statement saved as a draft. Publish it to make it visible to researchers.");
      await load();
    } catch (err) {
      setError(getApiError(err, "Unable to save the problem statement."));
    }
  };

  const run = async (action, id, success) => {
    setError("");
    setStatus("");
    try {
      await action(id);
      setStatus(success);
      await load();
    } catch (err) {
      setError(getApiError(err, "Unable to update the problem statement."));
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold text-navy">
        {isCorporate ? "Industry problem statements" : "Open industry problems"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {isCorporate
          ? "Post challenges your R&D team needs academic researchers to work on."
          : "Browse open industry problems and request collaboration with the company."}
      </p>

      {error && <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</p>}
      {status && <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{status}</p>}

      {isCorporate ? (
        <form className="mt-8 grid gap-4 rounded-2xl border border-line bg-card p-6" onSubmit={submitProblem}>
          <h2 className="font-serif text-xl font-semibold text-navy">New problem statement</h2>
          <Field label="Title">
            <TextInput value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          </Field>
          <Field label="Domain">
            <TextInput
              value={form.domain}
              onChange={(event) => setForm({ ...form, domain: event.target.value })}
              placeholder="e.g. battery materials, computer vision"
              required
            />
          </Field>
          <Field label="Problem statement">
            <TextArea
              rows={5}
              value={form.statement}
              onChange={(event) => setForm({ ...form, statement: event.target.value })}
              required
            />
          </Field>
          <Field label="Desired outcomes">
            <ChipInput
              values={form.desired_outcomes}
              onChange={(desired_outcomes) => setForm({ ...form, desired_outcomes })}
              placeholder="Add an outcome and press Enter"
            />
          </Field>
          <Field label="Technologies">
            <ChipInput
              values={form.technologies}
              onChange={(technologies) => setForm({ ...form, technologies })}
              placeholder="Add a technology and press Enter"
            />
          </Field>
          <button type="submit" className="rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-dark">
            Save draft
          </button>
        </form>
      ) : (
        <form
          className="mt-6 flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(domain.trim());
          }}
        >
          <input
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
            placeholder="Search by domain"
            className="min-w-[220px] flex-1 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-blue"
          />
          <button type="submit" className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark">
            Search
          </button>
        </form>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-muted">Loading problem statements...</p>
      ) : data.items.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No problem statements yet.</p>
      ) : (
        <div className="mt-8 grid gap-5">
          {data.items.map((problem) => (
            <article key={problem.id} className="rounded-2xl border border-line bg-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-serif text-xl font-semibold text-navy">{problem.title}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {problem.domain}
                    {problem.company?.company_name ? ` · ${problem.company.company_name}` : ""}
                  </p>
                </div>
                <span className="rounded-full bg-blue-soft px-3 py-1 text-xs font-medium capitalize text-navy">
                  {problem.status}
                </span>
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-muted">{problem.statement}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to={`/problems/${problem.id}`}
                  className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark"
                >
                  View
                </Link>
                {isCorporate && problem.status !== "open" && problem.status !== "closed" ? (
                  <button
                    type="button"
                    onClick={() => run(publishProblem, problem.id, "Problem published for researchers.")}
                    className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-navy hover:bg-blue-soft"
                  >
                    Publish
                  </button>
                ) : null}
                {isCorporate && problem.status === "open" ? (
                  <button
                    type="button"
                    onClick={() => run(closeProblem, problem.id, "Problem closed.")}
                    className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-navy hover:bg-blue-soft"
                  >
                    Close
                  </button>
                ) : null}
                {isCorporate && problem.status !== "open" ? (
                  <button
                    type="button"
                    onClick={() => run(deleteProblem, problem.id, "Problem deleted.")}
                    className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
