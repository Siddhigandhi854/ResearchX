import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, loginAccount, registerAccount } from "../services/authService.js";
import {
  clearAuth,
  dashboardPath,
  getStoredToken,
  getStoredUser,
  persistAuth,
} from "../utils/authStorage.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(getStoredToken);
  const [loading, setLoading] = useState(Boolean(getStoredToken()));

  useEffect(() => {
    let active = true;
    const stored = getStoredToken();
    if (!stored) {
      setLoading(false);
      return undefined;
    }

    getCurrentUser()
      .then((current) => {
        if (!active) return;
        setUser(current);
        persistAuth(stored, current);
      })
      .catch(() => {
        if (!active) return;
        clearAuth();
        setUser(null);
        setToken(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = async (credentials) => {
    const data = await loginAccount(credentials);
    persistAuth(data.access_token, data.user);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const created = await registerAccount(payload);
    const data = await loginAccount({ email: payload.email, password: payload.password });
    persistAuth(data.access_token, data.user || created);
    setToken(data.access_token);
    setUser(data.user || created);
    return data.user || created;
  };

  const logout = () => {
    clearAuth();
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout,
      dashboardPath: user ? dashboardPath(user.role) : "/login",
    }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
