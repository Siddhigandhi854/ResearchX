import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  FileSearch,
  FlaskConical,
  GraduationCap,
  Handshake,
} from "lucide-react";
import SystemStatus from "../components/SystemStatus.jsx";

const highlights = [
  {
    icon: GraduationCap,
    title: "For researchers",
    text: "Publish projects, papers, and prototypes so industry teams can find work that is ready for collaboration.",
  },
  {
    icon: Building2,
    title: "For corporate R&D",
    text: "Describe technology problems, discover relevant research, and move from literature to prototype, POC, and pilot.",
  },
  {
    icon: Handshake,
    title: "Structured collaboration",
    text: "Track requests, compatibility, and progress without turning research matching into a job board.",
  },
];

export default function LandingPage() {
  return (
    <div>
      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-blue">
              ResearchX
            </p>
            <h1 className="font-serif text-4xl font-semibold leading-tight text-navy sm:text-5xl">
              Connecting Academic Innovation with Industry
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              Discover research, connect with innovators, and move promising ideas from
              research to prototype, POC and pilot.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/researcher"
                className="inline-flex items-center gap-2 rounded-lg bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-navy-dark"
              >
                Explore Research
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-5 py-3 text-sm font-semibold text-navy hover:bg-blue-soft"
              >
                Join ResearchX
              </Link>
            </div>
            <div className="mt-8">
              <SystemStatus />
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-6">
            <div className="mb-4 flex items-center gap-2 text-navy">
              <FileSearch size={20} />
              <h2 className="font-serif text-xl font-semibold">What this platform is for</h2>
            </div>
            <ul className="space-y-4 text-sm leading-relaxed text-muted">
              <li>University labs surface applied research and working prototypes.</li>
              <li>Corporate R&D scouts evaluate technical fit, not résumés.</li>
              <li>Admins verify institutions and keep collaborations accountable.</li>
            </ul>
            <div className="mt-6 rounded-xl bg-white p-4 text-sm text-ink">
              <p className="font-medium text-navy">Not a hiring marketplace.</p>
              <p className="mt-1 text-muted">
                ResearchX is built around projects, papers, technology problems, and
                collaboration requests.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          {highlights.map((item) => (
            <article key={item.title} className="rounded-2xl border border-line bg-card p-6 shadow-sm">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-soft text-navy">
                <item.icon size={20} />
              </div>
              <h3 className="font-serif text-lg font-semibold text-navy">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-start gap-3">
            <FlaskConical className="mt-0.5 text-blue" size={20} />
            <div>
              <h2 className="font-serif text-2xl font-semibold text-navy">Start with a workspace</h2>
              <p className="mt-1 text-sm text-muted">
                Researcher, corporate, and admin areas are available as placeholders in this
                foundation release.
              </p>
            </div>
          </div>
          <Link
            to="/corporate"
            className="inline-flex items-center justify-center rounded-lg bg-blue px-5 py-3 text-sm font-semibold text-white hover:bg-navy"
          >
            View industry workspace
          </Link>
        </div>
      </section>
    </div>
  );
}
