import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function ResearcherPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-line bg-card p-8 shadow-sm">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-soft text-navy">
          <GraduationCap size={22} />
        </div>
        <h1 className="font-serif text-3xl font-semibold text-navy">Researcher Dashboard</h1>
        <p className="mt-2 text-muted">Welcome, {user?.name}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/researcher/projects"
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark"
          >
            Manage projects
          </Link>
          <Link
            to="/profile/edit"
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-navy hover:bg-blue-soft"
          >
            Edit profile
          </Link>
          <Link
            to={`/researchers/${user?.id}`}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-navy hover:bg-blue-soft"
          >
            View public profile
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
          <Link
            to="/problems"
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-navy hover:bg-blue-soft"
          >
            Industry problems
          </Link>
          <Link
            to="/researchers"
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-navy hover:bg-blue-soft"
          >
            Browse researchers
          </Link>
        </div>
      </div>
    </div>
  );
}
