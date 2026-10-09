import { useState } from "react";

export default function ChipInput({ values, onChange, placeholder }) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const next = draft.trim();
    if (!next || values.includes(next)) {
      setDraft("");
      return;
    }
    onChange([...values, next]);
    setDraft("");
  };

  return (
    <div>
      <div className="mt-1 flex flex-wrap gap-2">
        {values.map((item) => (
          <span key={item} className="inline-flex items-center gap-1 rounded-full bg-blue-soft px-3 py-1 text-xs text-navy">
            {item}
            <button
              type="button"
              onClick={() => onChange(values.filter((value) => value !== item))}
              className="text-muted hover:text-navy"
              aria-label={`Remove ${item}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
          className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-blue"
        />
        <button type="button" onClick={add} className="rounded-lg border border-line px-3 py-2 text-sm text-navy hover:bg-blue-soft">
          Add
        </button>
      </div>
    </div>
  );
}
