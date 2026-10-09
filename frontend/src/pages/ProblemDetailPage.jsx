import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CollaborationModal from "../components/CollaborationModal.jsx";
import ChipInput from "../components/ChipInput.jsx";
import { Field, TextArea, TextInput } from "../components/FormFields.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getApiError } from "../services/api.js";
import { getProblem, publishProblem, updateProblem } from "../services/problemService.js";
import { getSentRequests } from "../services/collaborationService.js";

export default function ProblemDetailPage() {
  const { problemId } = useParams();
  const { user } = useAuth();
  const [problem, setProblem] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [requestStatus, setRequestStatus] = useState("");

  const isOwner = user?.role === "corporate" && problem?.company?.user_id === user?.id;
  const canApply = user?.role === "researcher" && problem?.status === "open";

  const load = async () => {
    const loaded = await getProblem(problemId);
    setProblem(loaded);
    setForm({
      title: loaded.title,
      domain: loaded.domain,
      statement: loaded.statement,
      desired_outcomes: loaded.desired_outcomes || [],
      technologies: loaded.technologies || [],
    });
  };

  useEffect(() => {
    setLoading(true);
    load()
      .catch((err) => setError(getApiError(err, "Unable to load this problem statement.")))
      .finally(() => setLoading(false));
  }, [problemId]);

  useEffect(() => {
    if (!canApply || !problem) return;
    getSentRequests()
      .then((sent) => {
        const match = (sent.items || []).find((item) => item.receiver?.id === problem.company.user_id);
        setRequestStatus(match?.status || "");
      })
      .catch(() => setRequestStatus(""));
  }, [canApply, problem?.company?.user_id]);

  const save = async (event) => {
    event.preventDefault();
    setError("");
    setStatus("");
    try {
      const updated = await updateProblem(problemId, form);
      setProblem(updated);
      setStatus("Problem statement saved.");
    } catch (err) {
      setError(getApiError(err, "Unable to save the problem statement."));
    }
  };

  if (loading) {
    return <p className="mx-auto max-w-4xl px-4 py-12 text-sm text-muted">Loading problem statement...</p>;
  }

  if (!problem) {
    return <p className="mx-auto max-w-4xl px-4 py-12 text-sm text-amber-900">{error || "Problem not found."}</p>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      {error && <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</p>}
      {status && <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{status}</p>}
      <p className="text-sm text-muted">
        <Link to="/problems" className="text-blue hover:underline">
          Back to problems
        </Link>
      </p>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue">{problem.status}</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-navy">{problem.title}</h1>
          <p className="mt-2 text-sm text-muted">
            {problem.company.company_name || problem.company.name} · {problem.domain}
          </p>
        </div>
        {canApply ? (
          requestStatus === "pending" ? (
            <span className="rounded-full bg-blue-soft px-3 py-1 text-xs font-medium text-navy">Request sent · Pending</span>
          ) : (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark"
            >
              Request to work on this
            </button>
          )
        ) : null}
        {isOwner && problem.status !== "open" && problem.status !== "closed" ? (
          <button
            type="button"
            onClick={async () => {
              try {
                setProblem(await publishProblem(problemId));
                setStatus("Published for researchers.");
              } catch (err) {
                setError(getApiError(err, "Unable to publish."));
              }
            }}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark"
          >
            Publish
          </button>
        ) : null}
      </div>

      {isOwner && form ? (
        <form className="mt-8 grid gap-4 rounded-2xl border border-line bg-card p-6" onSubmit={save}>
          <Field label="Title">
            <TextInput value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </Field>
          <Field label="Domain">
            <TextInput value={form.domain} onChange={(event) => setForm({ ...form, domain: event.target.value })} />
          </Field>
          <Field label="Problem statement">
            <TextArea rows={6} value={form.statement} onChange={(event) => setForm({ ...form, statement: event.target.value })} />
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
            Save changes
          </button>
        </form>
      ) : (
        <div className="mt-8 grid gap-5">
          <section className="rounded-2xl border border-line bg-card p-6">
            <h2 className="font-serif text-lg font-semibold text-navy">Problem</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">{problem.statement}</p>
          </section>
          <section className="rounded-2xl border border-line bg-card p-6">
            <h2 className="font-serif text-lg font-semibold text-navy">Desired outcomes</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(problem.desired_outcomes || []).length === 0 ? (
                <p className="text-sm text-muted">Not provided yet.</p>
              ) : (
                problem.desired_outcomes.map((item) => (
                  <span key={item} className="rounded-full bg-blue-soft px-3 py-1 text-xs text-navy">
                    {item}
                  </span>
                ))
              )}
            </div>
          </section>
          <section className="rounded-2xl border border-line bg-card p-6">
            <h2 className="font-serif text-lg font-semibold text-navy">Technologies</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(problem.technologies || []).length === 0 ? (
                <p className="text-sm text-muted">Not provided yet.</p>
              ) : (
                problem.technologies.map((item) => (
                  <span key={item} className="rounded-full bg-blue-soft px-3 py-1 text-xs text-navy">
                    {item}
                  </span>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {canApply ? (
        <CollaborationModal
          open={modalOpen}
          receiverId={problem.company.user_id}
          receiverName={problem.company.company_name || problem.company.name}
          lockedProblemId={problem.id}
          onClose={() => setModalOpen(false)}
          onSent={() => setRequestStatus("pending")}
        />
      ) : null}
    </div>
  );
}
