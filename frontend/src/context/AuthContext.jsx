import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const loadSession = async () => {
    try {
      const { data } = await api.get("/auth/me/");
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setCheckingSession(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const login = async ({ email, password }) => {
    setLoading(true);
    try {
      setUser(null);
      const { data } = await api.post("/auth/token/", { email, password });
      const profile = data.user || { nome: email, email, tipo_usuario: "administrador" };
      setUser(profile);
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout/");
    } catch {
      // The local session still needs to be cleared if the backend is unreachable.
    } finally {
      setUser(null);
      setCheckingSession(false);
    }
  };

  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
      setCheckingSession(false);
    };
    window.addEventListener("sap:auth-expired", handleAuthExpired);
    return () => window.removeEventListener("sap:auth-expired", handleAuthExpired);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      checkingSession,
      login,
      logout,
      isAuthenticated: Boolean(user),
    }),
    [user, loading, checkingSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
}
