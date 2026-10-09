import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getApiError } from "../services/api.js";
import {
  acceptRequest,
  cancelRequest,
  getReceivedRequests,
  getSentRequests,
  rejectRequest,
} from "../services/collaborationService.js";

function PersonLink({ person }) {
  if (person?.role === "researcher") {
    return (
      <Link to={`/researchers/${person.id}`} className="font-semibold text-navy hover:underline">
        {person.name}
      </Link>
    );
  }
  return <span className="font-semibold text-navy">{person?.name}</span>;
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

export default function CollaborationsPage() {
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [incoming, outgoing] = await Promise.all([getReceivedRequests(), getSentRequests()]);
      setReceived(incoming.items || []);
      setSent(outgoing.items || []);
    } catch (err) {
      setError(getApiError(err, "Unable to load collaboration requests."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const run = async (action, id, success) => {
    setError("");
    setStatus("");
    try {
      await action(id);
      setStatus(success);
      await load();
    } catch (err) {
      setError(getApiError(err, "Unable to update the request."));
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold text-navy">Collaborations</h1>
      <p className="mt-2 text-sm text-muted">Review incoming requests and track the ones you sent.</p>
      {error && <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</p>}
      {status && <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{status}</p>}
      {loading ? (
        <p className="mt-6 text-sm text-muted">Loading collaboration requests...</p>
      ) : (
        <div className="mt-8 grid gap-8">
          <section>
            <h2 className="font-serif text-xl font-semibold text-navy">Received Requests</h2>
            {received.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No collaboration requests yet.</p>
            ) : (
              <div className="mt-4 grid gap-4">
                {received.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-line bg-card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <PersonLink person={item.sender} />
                        <p className="mt-1 text-sm text-muted">{item.sender.domain || "Domain not specified"}</p>
                        <p className="mt-1 text-sm text-muted">
                          {item.problem?.title
                            ? `Problem: ${item.problem.title}`
                            : `Project: ${item.project?.title || "General collaboration"}`}
                        </p>
                      </div>
                      <span className="rounded-full bg-blue-soft px-3 py-1 text-xs font-medium capitalize text-navy">
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-muted">{item.message || "No message provided."}</p>
                    <p className="mt-2 text-xs text-muted">{formatDate(item.created_at)}</p>
                    {item.status === "pending" && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => run(acceptRequest, item.id, "Request accepted.")}
                          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => run(rejectRequest, item.id, "Request rejected.")}
                          className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-navy hover:bg-blue-soft"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {item.status === "accepted" && (
                      <Link to="/workspaces" className="mt-4 inline-block text-sm font-medium text-blue hover:underline">
                        Open workspaces
                      </Link>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-navy">Sent Requests</h2>
            {sent.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No collaboration requests yet.</p>
            ) : (
              <div className="mt-4 grid gap-4">
                {sent.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-line bg-card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <PersonLink person={item.receiver} />
                        <p className="mt-1 text-sm text-muted">
                          {item.problem?.title
                            ? `Problem: ${item.problem.title}`
                            : `Project: ${item.project?.title || "General collaboration"}`}
                        </p>
                      </div>
                      <span className="rounded-full bg-blue-soft px-3 py-1 text-xs font-medium capitalize text-navy">
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-muted">{item.message || "No message provided."}</p>
                    <p className="mt-2 text-xs text-muted">{formatDate(item.created_at)}</p>
                    {item.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => run(cancelRequest, item.id, "Request cancelled.")}
                        className="mt-4 rounded-lg border border-line px-4 py-2 text-sm font-medium text-navy hover:bg-blue-soft"
                      >
                        Cancel
                      </button>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
