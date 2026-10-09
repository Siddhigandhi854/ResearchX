import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { getApiError } from "../services/api.js";
import { dashboardPath } from "../utils/authStorage.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "researcher",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.password || !form.confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (!EMAIL_PATTERN.test(form.email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Password confirmation must match.");
      return;
    }
    if (!["researcher", "corporate"].includes(form.role)) {
      setError("Choose a valid role.");
      return;
    }

    setSubmitting(true);
    try {
      const user = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      navigate(dashboardPath(user.role), { replace: true });
    } catch (err) {
      setError(getApiError(err, "Unable to create your account."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-2xl border border-line bg-card p-8 shadow-sm">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-soft text-navy">
          <UserPlus size={22} />
        </div>
        <h1 className="font-serif text-3xl font-semibold text-navy">Join ResearchX</h1>
        <p className="mt-2 text-sm text-muted">Create a researcher or corporate R&D account.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-ink">
            Full Name
            <input
              type="text"
              value={form.name}
              onChange={update("name")}
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-blue"
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            Email
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={update("email")}
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-blue"
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            Password
            <input
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={update("password")}
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-blue"
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            Confirm Password
            <input
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={update("confirmPassword")}
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-blue"
            />
          </label>
          <fieldset>
            <legend className="text-sm font-medium text-ink">Role</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm">
                <input
                  type="radio"
                  name="role"
                  value="researcher"
                  checked={form.role === "researcher"}
                  onChange={update("role")}
                />
                Researcher
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm">
                <input
                  type="radio"
                  name="role"
                  value="corporate"
                  checked={form.role === "corporate"}
                  onChange={update("role")}
                />
                Corporate R&amp;D
              </label>
            </div>
          </fieldset>
          {error && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-navy hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
