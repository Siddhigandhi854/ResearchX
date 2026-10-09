export function splitList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinList(value) {
  return Array.isArray(value) ? value.join(", ") : "";
}

export function Field({ label, children }) {
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      {children}
    </label>
  );
}

export function TextInput(props) {
  return (
    <input
      {...props}
      className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-blue"
    />
  );
}

export function TextArea(props) {
  return (
    <textarea
      {...props}
      className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-blue"
    />
  );
}
