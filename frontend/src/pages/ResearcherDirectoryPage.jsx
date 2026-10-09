import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getApiError } from "../services/api.js";
import { listResearchers } from "../services/profileService.js";

export default function ResearcherDirectoryPage() {
  const [domain, setDomain] = useState("");
  const [query, setQuery] = useState("");
  const [data, setData] = useState({ items: [], page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    listResearchers(1, 48, query)
      .then(setData)
      .catch((err) => setError(getApiError(err, "Unable to load researchers.")))
      .finally(() => setLoading(false));
  }, [query]);

  const search = (event) => {
    event.preventDefault();
    setQuery(domain.trim());
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold text-navy">Researchers</h1>
      <p className="mt-2 text-sm text-muted">Browse public researcher profiles and filter by research domain.</p>
      <form className="mt-6 flex flex-wrap gap-2" onSubmit={search}>
        <input
          value={domain}
          onChange={(event) => setDomain(event.target.value)}
          placeholder="Search domain, e.g. AI, materials, climate"
          className="min-w-[220px] flex-1 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-blue"
        />
        <button type="submit" className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark">
          Search
        </button>
        {query ? (
          <button
            type="button"
            onClick={() => {
              setDomain("");
              setQuery("");
            }}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-navy hover:bg-blue-soft"
          >
            Clear
          </button>
        ) : null}
      </form>
      {error && <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</p>}
      {loading ? (
        <p className="mt-6 text-sm text-muted">Loading researchers...</p>
      ) : data.items.length === 0 ? (
        <p className="mt-6 text-sm text-muted">
          {query ? "No researchers match that domain yet." : "No public researcher profiles yet."}
        </p>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {data.items.map((person) => (
            <article key={person.user_id} className="rounded-2xl border border-line bg-card p-6">
              <h2 className="font-serif text-xl font-semibold text-navy">{person.name}</h2>
              <p className="mt-1 text-sm text-muted">
                {[person.institution, person.department].filter(Boolean).join(" · ") || "Institution not provided"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(person.research_domains || []).slice(0, 4).map((item) => (
                  <span key={item} className="rounded-full bg-blue-soft px-3 py-1 text-xs text-navy">
                    {item}
                  </span>
                ))}
              </div>
              <Link
                to={`/researchers/${person.user_id}`}
                className="mt-4 inline-block rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark"
              >
                View profile
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
