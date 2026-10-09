import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CollaborationModal from "../components/CollaborationModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getApiError } from "../services/api.js";
import { getPublicResearcher } from "../services/profileService.js";
import { getSentRequests } from "../services/collaborationService.js";

function BadgeList({ title, items }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-6">
      <h2 className="font-serif text-lg font-semibold text-navy">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {(items || []).length === 0 ? (
          <p className="text-sm text-muted">Not provided yet.</p>
        ) : (
          items.map((item) => (
            <span key={item} className="rounded-full bg-blue-soft px-3 py-1 text-xs text-navy">
              {item}
            </span>
          ))
        )}
      </div>
    </section>
  );
}

function statusLabel(status) {
  if (status === "pending") return "Pending";
  if (status === "accepted") return "Accepted";
  if (status === "rejected") return "Rejected";
  if (status === "cancelled") return "Cancelled";
  return "";
}

export default function ResearcherPublicPage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [requestStatus, setRequestStatus] = useState("");

  const isSelf = user?.id === userId;

  const loadStatus = async () => {
    if (isSelf) return;
    try {
      const sent = await getSentRequests();
      const match = (sent.items || []).find((item) => item.receiver?.id === userId);
      setRequestStatus(match?.status || "");
    } catch {
      setRequestStatus("");
    }
  };

  useEffect(() => {
    setLoading(true);
    getPublicResearcher(userId)
      .then(setProfile)
      .catch((err) => setError(getApiError(err, "Unable to load this researcher.")))
      .finally(() => setLoading(false));
    loadStatus();
  }, [userId]);

  if (loading) {
    return <p className="mx-auto max-w-4xl px-4 py-12 text-sm text-muted">Loading profile...</p>;
  }

  if (!profile) {
    return <p className="mx-auto max-w-4xl px-4 py-12 text-sm text-amber-900">{error || "Researcher not found."}</p>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <section className="rounded-2xl border border-line bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {profile.profile_image ? (
            <img src={profile.profile_image} alt="" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-soft font-serif text-2xl text-navy">
              {(profile.name || "?").slice(0, 1)}
            </div>
          )}
          <div className="flex-1">
            <h1 className="font-serif text-3xl font-semibold text-navy">{profile.name}</h1>
            <p className="mt-1 text-sm text-muted">
              {[profile.institution, profile.department].filter(Boolean).join(" · ") || "Institution not provided"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(profile.research_domains || []).map((item) => (
                <span key={item} className="rounded-full bg-blue-soft px-3 py-1 text-xs text-navy">
                  {item}
                </span>
              ))}
            </div>
          </div>
          {!isSelf && (
            <div className="flex flex-col items-start gap-2">
              {requestStatus ? (
                <span className="rounded-full bg-blue-soft px-3 py-1 text-xs font-medium capitalize text-navy">
                  {requestStatus === "pending" ? "Request Sent · Pending" : statusLabel(requestStatus)}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark"
                >
                  Request Collaboration
                </button>
              )}
              {requestStatus === "rejected" || requestStatus === "cancelled" ? (
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="text-xs font-medium text-blue hover:underline"
                >
                  Send a new request
                </button>
              ) : null}
            </div>
          )}
        </div>
        <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-muted">{profile.bio || "No bio yet."}</p>
      </section>

      <div className="mt-5 grid gap-5">
        <BadgeList title="Research Interests" items={profile.research_interests} />
        <BadgeList title="Skills" items={profile.skills} />
        <BadgeList title="Technologies" items={profile.technologies} />
        <section className="rounded-2xl border border-line bg-card p-6">
          <h2 className="font-serif text-lg font-semibold text-navy">Research Projects</h2>
          {(profile.projects || []).length === 0 ? (
            <p className="mt-3 text-sm text-muted">No research projects yet.</p>
          ) : (
            <div className="mt-4 grid gap-4">
              {profile.projects.map((project) => (
                <article key={project.id} className="rounded-xl border border-line bg-surface p-4">
                  <h3 className="font-semibold text-navy">{project.title}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {project.domain}
                    {project.research_stage ? ` · ${project.research_stage}` : ""}
                  </p>
                  <p className="mt-2 text-sm text-muted">{project.description || "No description yet."}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(project.technologies || []).map((item) => (
                      <span key={item} className="rounded-full bg-blue-soft px-3 py-1 text-xs text-navy">
                        {item}
                      </span>
                    ))}
                  </div>
                  <Link
                    to={`/researcher/projects/${project.id}`}
                    className="mt-4 inline-block rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-navy hover:bg-blue-soft"
                  >
                    View Project
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <CollaborationModal
        open={modalOpen}
        receiverId={profile.user_id}
        receiverName={profile.name}
        onClose={() => setModalOpen(false)}
        onSent={() => {
          setRequestStatus("pending");
        }}
      />
    </div>
  );
}
