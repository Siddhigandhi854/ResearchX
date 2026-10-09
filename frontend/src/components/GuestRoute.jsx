import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { dashboardPath } from "../utils/authStorage.js";

export default function GuestRoute({ children }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted">
        Checking your session…
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={dashboardPath(user.role)} replace />;
  }

  return children;
}
