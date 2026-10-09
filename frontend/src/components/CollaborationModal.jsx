import { useEffect, useState } from "react";
import { getApiError } from "../services/api.js";
import { getMyProjects } from "../services/projectService.js";
import { listMyProblems } from "../services/problemService.js";
import { sendCollaborationRequest } from "../services/collaborationService.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function CollaborationModal({
  open,
  receiverName,
  receiverId,
  onClose,
  onSent,
  lockedProblemId = "",
}) {
  const { user } = useAuth();
  const isCorporate = user?.role === "corporate";
  const [projects, setProjects] = useState([]);
  const [problems, setProblems] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [problemId, setProblemId] = useState(lockedProblemId || "");
  const [message, setMessage] = useState("I am interested in collaborating.");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setStatus("");
    setMessage(
      isCorporate
        ? "Our R&D team would like to collaborate with you."
        : "I am interested in collaborating on this research.",
    );
    setProjectId("");
    setProblemId(lockedProblemId || "");
    if (isCorporate) {
      listMyProblems(1, 50)
        .then((data) => setProblems(data.items || []))
        .catch(() => setProblems([]));
      setProjects([]);
    } else {
      getMyProjects(1, 50)
        .then((data) => setProjects(data.items || []))
        .catch(() => setProjects([]));
      setProblems([]);
    }
  }, [open, receiverId, isCorporate, lockedProblemId]);

  if (!open) return null;

  const submit = async (event) => {
    event.preventDefault();
    if (sending) return;
    setError("");
    setStatus("");
    setSending(true);
    try {
      await sendCollaborationRequest({
        receiver_id: receiverId,
        project_id: isCorporate ? null : projectId || null,
        problem_id: problemId || null,
        message,
      });
      setStatus("Collaboration request sent successfully.");
      onSent?.();
    } catch (err) {
      setError(getApiError(err, "Unable to send the collaboration request."));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-navy/40 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-white p-6 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-semibold text-navy">Request Collaboration</h2>
            <p className="mt-1 text-sm text-muted">Send a request to {receiverName}.</p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-muted hover:text-navy">
            Close
          </button>
        </div>
        <form className="mt-5 grid gap-4" onSubmit={submit}>
          {isCorporate ? (
            <label className="text-sm font-medium text-ink">
              Related problem statement
              <select
                value={problemId}
                disabled={Boolean(lockedProblemId)}
                onChange={(event) => setProblemId(event.target.value)}
                className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-blue disabled:bg-surface"
              >
                <option value="">General collaboration (optional)</option>
                {problems.map((problem) => (
                  <option key={problem.id} value={problem.id}>
                    {problem.title}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <label className="text-sm font-medium text-ink">
                Collaborating on
                <select
                  value={projectId}
                  onChange={(event) => setProjectId(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-blue"
                >
                  <option value="">General collaboration (optional)</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </label>
              {lockedProblemId ? <input type="hidden" value={problemId} readOnly /> : null}
            </>
          )}
          <label className="text-sm font-medium text-ink">
            Message
            <textarea
              value={message}
              maxLength={1000}
              rows={4}
              onChange={(event) => setMessage(event.target.value)}
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-blue"
            />
          </label>
          {error && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</p>}
          {status && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{status}</p>}
          <button
            type="submit"
            disabled={sending}
            className="rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send Request"}
          </button>
        </form>
      </div>
    </div>
  );
}
