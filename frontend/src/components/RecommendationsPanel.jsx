import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import CollaborationModal from "./CollaborationModal.jsx";

function ScoreBar({ score }) {
  const width = Math.max(0, Math.min(100, score || 0));
  return (
    <div className="mt-2">
      <p className="text-sm font-semibold text-navy">{width}% Match</p>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-blue-soft">
        <div className="h-full rounded-full bg-blue" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function ChipList({ items, prefix = "chip" }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={`${prefix}-${item}`} className="rounded-full bg-blue-soft px-3 py-1 text-xs text-navy">
          ✓ {item}
        </span>
      ))}
    </div>
  );
}

export default function RecommendationsPanel({
  loading,
  error,
  projectRecs,
  researcherRecs,
  onRetry,
}) {
  const [invite, setInvite] = useState(null);
  const projects = projectRecs?.recommendations || [];
  const researchers = researcherRecs?.recommendations || [];
  const empty =
    !loading &&
    !error &&
    projects.length === 0 &&
    researchers.length === 0;

  return (
    <section className="rounded-2xl border border-line bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-navy">
          <Sparkles size={18} />
          <h2 className="font-serif text-lg font-semibold">AI Research Recommendations</h2>
        </div>
      </div>

      {loading && <p className="mt-4 text-sm text-muted">Finding relevant research...</p>}

      {error && (
        <div className="mt-4">
          <p className="text-sm text-amber-900">Unable to load recommendations. Please try again.</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark"
          >
            Retry
          </button>
        </div>
      )}

      {empty && (
        <p className="mt-4 text-sm text-muted">
          No strong research matches found yet. Try adding more research details or uploading another paper.
        </p>
      )}

      {!loading && !error && projects.length > 0 && (
        <div className="mt-5 grid gap-4">
          {projects.map((item) => (
            <article key={item.project_id} className="rounded-xl border border-line bg-surface p-4">
              <h3 className="font-serif text-lg font-semibold text-navy">{item.title}</h3>
              <p className="mt-1 text-sm text-muted">{item.domain || "Domain not specified"}</p>
              <ScoreBar score={item.similarity_score} />
              <ChipList items={[...(item.matched_skills || []), ...(item.matched_technologies || [])]} />
              {item.reason && (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-navy">Why this project matches</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{item.reason}</p>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to={`/researcher/projects/${item.project_id}`}
                  className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-navy hover:bg-blue-soft"
                >
                  View Project
                </Link>
                {item.researcher_id && (
                  <>
                    <Link
                      to={`/researchers/${item.researcher_id}`}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-navy hover:bg-blue-soft"
                    >
                      View Researcher
                    </Link>
                    <button
                      type="button"
                      onClick={() => setInvite({ id: item.researcher_id, name: "this researcher" })}
                      className="rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-dark"
                    >
                      Request Collaboration
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && !error && researchers.length > 0 && (
        <div className="mt-6">
          <h3 className="font-serif text-base font-semibold text-navy">Researchers</h3>
          <div className="mt-3 grid gap-4">
            {researchers.map((person) => (
              <article key={person.user_id} className="rounded-xl border border-line bg-surface p-4">
                <h4 className="font-semibold text-navy">{person.name}</h4>
                <p className="mt-1 text-sm text-muted">{person.domain || "Domain not specified"}</p>
                <ScoreBar score={person.similarity_score} />
                <ChipList items={person.matched_skills} />
                {person.matched_projects?.length > 0 && (
                  <p className="mt-3 text-xs text-muted">
                    Matched projects: {person.matched_projects.map((project) => project.title).join(", ")}
                  </p>
                )}
                {person.reason && <p className="mt-2 text-sm leading-relaxed text-muted">{person.reason}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to={`/researchers/${person.user_id}`}
                    className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-navy hover:bg-blue-soft"
                  >
                    View Researcher
                  </Link>
                  <button
                    type="button"
                    onClick={() => setInvite({ id: person.user_id, name: person.name })}
                    className="rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-dark"
                  >
                    Request Collaboration
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      <CollaborationModal
        open={Boolean(invite)}
        receiverId={invite?.id}
        receiverName={invite?.name || "this researcher"}
        onClose={() => setInvite(null)}
      />
    </section>
  );
}
