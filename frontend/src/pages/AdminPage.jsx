import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { getApiError } from "../services/api.js";
import {
  activateAdminUser,
  deactivateAdminUser,
  listAdminUsers,
  verifyAdminUser,
} from "../services/authService.js";

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = () =>
    listAdminUsers()
      .then(setUsers)
      .catch((err) => setError(getApiError(err, "Unable to load users.")));

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const runAction = async (action, userId) => {
    setError("");
    try {
      await action(userId);
      await refresh();
    } catch (err) {
      setError(getApiError(err, "Unable to update user."));
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-line bg-card p-8 shadow-sm">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-soft text-navy">
          <ShieldCheck size={22} />
        </div>
        <h1 className="font-serif text-3xl font-semibold text-navy">Admin Dashboard</h1>
        <p className="mt-2 text-muted">Welcome, {user?.name}</p>
        {loading ? (
          <p className="mt-6 text-sm text-muted">Loading users…</p>
        ) : (
          <div className="mt-8 overflow-x-auto">
            {error && <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</p>}
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 pr-4 font-medium">Role</th>
                  <th className="py-2 pr-4 font-medium">Verified</th>
                  <th className="py-2 pr-4 font-medium">Active</th>
                  <th className="py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.id} className="border-b border-line">
                    <td className="py-3 pr-4">{item.name}</td>
                    <td className="py-3 pr-4">{item.email}</td>
                    <td className="py-3 pr-4">{item.role}</td>
                    <td className="py-3 pr-4">{item.is_verified ? "Yes" : "No"}</td>
                    <td className="py-3 pr-4">{item.is_active ? "Yes" : "No"}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        {!item.is_verified && (
                          <button
                            type="button"
                            onClick={() => runAction(verifyAdminUser, item.id)}
                            className="rounded-md border border-line px-2 py-1 text-xs text-navy hover:bg-blue-soft"
                          >
                            Verify
                          </button>
                        )}
                        {item.is_active ? (
                          <button
                            type="button"
                            onClick={() => runAction(deactivateAdminUser, item.id)}
                            className="rounded-md border border-line px-2 py-1 text-xs text-navy hover:bg-blue-soft"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => runAction(activateAdminUser, item.id)}
                            className="rounded-md border border-line px-2 py-1 text-xs text-navy hover:bg-blue-soft"
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
