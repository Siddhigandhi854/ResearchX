import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FileText, FlaskConical } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import RecommendationsPanel from "../components/RecommendationsPanel.jsx";
import { getApiError } from "../services/api.js";
import { deletePaper, downloadPaper, getAnalysis, getPaper, getProject, uploadPaper, analyzeProject } from "../services/projectService.js";
import { getProjectRecommendations, getResearcherRecommendations } from "../services/recommendationService.js";

function bytesToSize(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [paper, setPaper] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [projectRecs, setProjectRecs] = useState(null);
  const [researcherRecs, setResearcherRecs] = useState(null);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsError, setRecsError] = useState("");

  const isOwner = Boolean(project && user && project.researcher_id === user.id);

  const loadRecommendations = async () => {
    setRecsError("");
    setRecsLoading(true);
    try {
      const [projects, researchers] = await Promise.all([
        getProjectRecommendations(id, 5),
        getResearcherRecommendations(id, 5),
      ]);
      setProjectRecs(projects);
      setResearcherRecs(researchers);
    } catch (err) {
      setProjectRecs(null);
      setResearcherRecs(null);
      setRecsError(getApiError(err, "Unable to load recommendations."));
    } finally {
      setRecsLoading(false);
    }
  };

  const load = async () => {
    const loaded = await getProject(id);
    setProject(loaded);
    const owner = loaded.researcher_id === user?.id;
    if (owner) {
      try {
        setPaper(await getPaper(id));
      } catch {
        setPaper(null);
      }
      try {
        setAnalysis(await getAnalysis(id));
      } catch {
        setAnalysis(null);
      }
    } else {
      setPaper(loaded.has_paper ? { original_filename: loaded.paper_filename, file_size: 0 } : null);
      setAnalysis({
        analysis_status: loaded.analysis_status,
        research_analysis: loaded.research_analysis,
      });
    }
  };

  useEffect(() => {
    load().catch((err) => setError(getApiError(err, "Unable to load project.")));
  }, [id]);

  useEffect(() => {
    if (isOwner) {
      loadRecommendations();
    }
  }, [id, isOwner]);

  const onFile = async (file) => {
    if (!file) return;
    setError("");
    setStatus("");
    setUploading(true);
    try {
      const uploaded = await uploadPaper(id, file);
      setPaper(uploaded);
      setAnalysis(await getAnalysis(id));
      setStatus("Research paper uploaded.");
    } catch (err) {
      setError(getApiError(err, "Unable to upload the PDF."));
    } finally {
      setUploading(false);
    }
  };

  const runAnalyze = async () => {
    setError("");
    setStatus("");
    setAnalyzing(true);
    setAnalysis((current) => ({ ...(current || {}), analysis_status: "processing", analysis_error: null }));
    try {
      const result = await analyzeProject(id);
      setAnalysis(result);
      setStatus("AI analysis completed.");
      loadRecommendations();
    } catch (err) {
      const message = getApiError(err, "Unable to analyze the research paper.");
      setAnalysis((current) => ({
        ...(current || {}),
        analysis_status: "failed",
        analysis_error: message,
      }));
      setError(message);
    } finally {
      setAnalyzing(false);
    }
  };

  if (!project && !error) {
    return <p className="mx-auto max-w-4xl px-4 py-12 text-sm text-muted">Loading project…</p>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      {error && <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</p>}
      {status && <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{status}</p>}
      {project && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue">{project.status}</p>
              <h1 className="mt-2 font-serif text-3xl font-semibold text-navy">{project.title}</h1>
              <p className="mt-2 text-sm text-muted">
                {project.researcher_name} · {project.research_domain} · {project.prototype_status}
              </p>
            </div>
            {isOwner && (
              <Link
                to={`/researcher/projects/${project.id}/edit`}
                className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark"
              >
                Edit
              </Link>
            )}
          </div>

          <div className="mt-8 grid gap-5">
            <Section title="Problem" body={project.problem_statement} />
            <Section title="Proposed solution" body={project.proposed_solution} />
            <Section title="Methodology" body={project.methodology} />
            <Section title="Results" body={project.results} />
            <ChipSection title="Technologies" items={project.technologies} />
            <ChipSection title="Industry applications" items={project.industry_applications} />
            <div className="rounded-2xl border border-line bg-card p-6">
              <h2 className="font-serif text-lg font-semibold text-navy">Links</h2>
              <p className="mt-2 text-sm text-muted">GitHub: {project.github_url || "Not provided"}</p>
              <p className="text-sm text-muted">Demo: {project.demo_url || "Not provided"}</p>
            </div>
            <AnalysisPanel
              analysis={analysis}
              analyzing={analyzing}
              hasPaper={Boolean(paper)}
              onAnalyze={runAnalyze}
              canManage={isOwner}
            />
            {isOwner && (
              <RecommendationsPanel
                loading={recsLoading}
                error={recsError}
                projectRecs={projectRecs}
                researcherRecs={researcherRecs}
                onRetry={loadRecommendations}
              />
            )}

            <div className="rounded-2xl border border-line bg-card p-6">
              <div className="flex items-center gap-2 text-navy">
                <FileText size={18} />
                <h2 className="font-serif text-lg font-semibold">Research paper</h2>
              </div>
              {paper ? (
                <div className="mt-4">
                  <p className="text-sm text-ink">{paper.original_filename}</p>
                  <p className="mt-1 text-xs text-muted">
                    {bytesToSize(paper.file_size)}
                    {paper.page_count ? ` · ${paper.page_count} pages` : ""}
                    {paper.analysis_status ? ` · Analysis: ${paper.analysis_status}` : ""}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {isOwner && (
                      <>
                        <button
                          type="button"
                          onClick={() => downloadPaper(id, paper.original_filename)}
                          className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-navy hover:bg-blue-soft"
                        >
                          Download
                        </button>
                        <label className="cursor-pointer rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-navy hover:bg-blue-soft">
                          Replace
                          <input
                            type="file"
                            accept="application/pdf,.pdf"
                            className="hidden"
                            onChange={(event) => onFile(event.target.files?.[0])}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!window.confirm("Delete this research paper?")) return;
                            try {
                              await deletePaper(id);
                              setPaper(null);
                              setAnalysis(await getAnalysis(id));
                              setStatus("Research paper deleted.");
                            } catch (err) {
                              setError(getApiError(err, "Unable to delete the paper."));
                            }
                          }}
                          className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : isOwner ? (
                <label
                  className="mt-4 flex cursor-pointer flex-col items-center rounded-xl border border-dashed border-line bg-surface px-4 py-8 text-center"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    onFile(event.dataTransfer.files?.[0]);
                  }}
                >
                  <p className="text-sm font-medium text-navy">Upload research paper</p>
                  <p className="mt-1 text-xs text-muted">PDF only, up to 20 MB. Drag and drop or browse.</p>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(event) => onFile(event.target.files?.[0])}
                  />
                  {uploading && <p className="mt-3 text-xs text-muted">Uploading…</p>}
                </label>
              ) : (
                <p className="mt-4 text-sm text-muted">No research paper is available for this project.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AnalysisPanel({ analysis, analyzing, hasPaper, onAnalyze, canManage }) {
  const raw = analyzing ? "processing" : analysis?.analysis_status || "pending";
  const statusValue = raw === "not_analyzed" ? "pending" : raw === "complete" ? "completed" : raw;
  const data = analysis?.research_analysis;

  return (
    <section className="rounded-2xl border border-line bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-navy">
          <FlaskConical size={18} />
          <h2 className="font-serif text-lg font-semibold">AI Research Analysis</h2>
        </div>
        <span className="rounded-full bg-blue-soft px-3 py-1 text-xs font-medium capitalize text-navy">
          {statusValue}
        </span>
      </div>

      {!hasPaper && (
        <p className="mt-4 text-sm text-muted">
          {canManage ? "Upload a research paper before running AI analysis." : "No AI analysis is available yet."}
        </p>
      )}

      {canManage && hasPaper && (statusValue === "pending" || !statusValue) && (
        <button
          type="button"
          onClick={onAnalyze}
          className="mt-4 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark"
        >
          Analyze Research with AI
        </button>
      )}

      {hasPaper && statusValue === "processing" && (
        <p className="mt-4 text-sm text-muted">Analyzing the paper with Gemini. This can take a minute…</p>
      )}

      {hasPaper && statusValue === "failed" && (
        <div className="mt-4">
          <p className="text-sm text-amber-900">{analysis?.analysis_error || "Analysis failed."}</p>
          {canManage && (
            <button
              type="button"
              onClick={onAnalyze}
              className="mt-3 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {hasPaper && statusValue === "completed" && data && (
        <div className="mt-5 grid gap-4">
          <AnalysisField label="Research Title" value={data.title} />
          <AnalysisField label="Research Problem" value={data.research_problem} />
          <AnalysisField label="Abstract" value={data.abstract} />
          <AnalysisList label="Objectives" items={data.objectives} />
          <AnalysisField label="Methodology" value={data.methodology} />
          <ChipSection title="Technologies" items={data.technologies} />
          <AnalysisField label="Domain" value={data.domain} />
          <ChipSection title="Keywords" items={data.keywords} />
          <AnalysisField label="Dataset" value={data.dataset} />
          <AnalysisField label="Results" value={data.results} />
          <AnalysisField label="Future Scope" value={data.future_scope} />
          <AnalysisField label="Innovation" value={data.innovation} />
          <AnalysisField label="Research Stage" value={data.research_stage} />
          <ChipSection title="Skills Required" items={data.skills_required} />
        </div>
      )}

      {canManage && hasPaper && statusValue === "completed" && (
        <button
          type="button"
          onClick={onAnalyze}
          className="mt-4 rounded-lg border border-line px-4 py-2 text-sm font-medium text-navy hover:bg-blue-soft"
        >
          Re-run AI analysis
        </button>
      )}
    </section>
  );
}

function AnalysisField({ label, value }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-navy">{label}</h3>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted">{value || "Not found in the paper."}</p>
    </div>
  );
}

function AnalysisList({ label, items }) {
  if (!items || items.length === 0) {
    return <AnalysisField label={label} value="" />;
  }
  return (
    <div>
      <h3 className="text-sm font-semibold text-navy">{label}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function Section({ title, body }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-6">
      <h2 className="font-serif text-lg font-semibold text-navy">{title}</h2>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">{body || "Not provided yet."}</p>
    </section>
  );
}

function ChipSection({ title, items }) {
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
