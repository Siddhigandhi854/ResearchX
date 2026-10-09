export default function PlaceholderPage({ title, description, icon: Icon }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="rounded-2xl border border-line bg-card p-8 shadow-sm">
        {Icon && (
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-soft text-navy">
            <Icon size={22} />
          </div>
        )}
        <h1 className="font-serif text-3xl font-semibold text-navy">{title}</h1>
        <p className="mt-3 text-muted">{description}</p>
        <p className="mt-6 rounded-lg bg-surface px-4 py-3 text-sm text-muted">
          This workspace is a placeholder for Step 1. Full profiles, dashboards, and
          collaboration workflows will be added in later steps.
        </p>
      </div>
    </div>
  );
}
