import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function MainLayout() {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, logout, dashboardPath } = useAuth();

  const navItems = [
    { to: "/", label: "Home", end: true },
    ...(isAuthenticated ? [{ to: dashboardPath, label: "Dashboard", end: true }] : []),
    ...(user?.role === "researcher"
      ? [
          { to: "/researcher/projects", label: "Projects", end: false },
          { to: "/researchers", label: "Researchers", end: true },
          { to: "/problems", label: "Problems", end: false },
          { to: "/collaborations", label: "Collaborations", end: false },
          { to: "/workspaces", label: "Workspaces", end: false },
          { to: "/profile/edit", label: "Profile", end: false },
        ]
      : []),
    ...(user?.role === "corporate"
      ? [
          { to: "/researchers", label: "Researchers", end: true },
          { to: "/problems", label: "Problems", end: false },
          { to: "/collaborations", label: "Collaborations", end: false },
          { to: "/workspaces", label: "Workspaces", end: false },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy font-serif text-lg font-semibold text-white">
              RX
            </span>
            <span className="font-serif text-xl font-semibold text-navy">ResearchX</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `text-sm font-medium ${isActive ? "text-navy" : "text-muted hover:text-navy"}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted">{user.name}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-navy hover:bg-blue-soft"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-navy hover:bg-blue-soft"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark"
                >
                  Join ResearchX
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-navy md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle navigation"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {open && (
          <div className="border-t border-line bg-white px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-2 text-sm font-medium text-ink hover:bg-blue-soft"
                >
                  {item.label}
                </NavLink>
              ))}
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="rounded-lg px-2 py-2 text-left text-sm text-navy"
                >
                  Sign out
                </button>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className="px-2 py-2 text-sm text-navy">
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setOpen(false)}
                    className="rounded-lg bg-navy px-3 py-2 text-center text-sm font-medium text-white"
                  >
                    Join ResearchX
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} ResearchX. Academic–industry collaboration.</p>
          <p>Profiles, matching, and collaboration requests are active.</p>
        </div>
      </footer>
    </div>
  );
}
