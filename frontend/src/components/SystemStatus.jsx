import { FlaskConical } from "lucide-react";
import { useApiHealth } from "../hooks/useApiHealth.js";

export default function SystemStatus() {
  const { health, error, loading } = useApiHealth();

  let label = "Checking API…";
  let tone = "bg-blue-soft text-navy";

  if (!loading && health?.database === "connected") {
    label = "API connected · MongoDB connected";
    tone = "bg-emerald-50 text-emerald-800";
  } else if (!loading) {
    label = error ? `API unavailable (${error})` : "API running · database disconnected";
    tone = "bg-amber-50 text-amber-900";
  }

  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${tone}`}>
      <FlaskConical size={14} />
      {label}
    </div>
  );
}
