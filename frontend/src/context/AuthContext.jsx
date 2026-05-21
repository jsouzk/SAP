import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

function getStoredUser() {
  const stored = localStorage.getItem("sap_user");
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    localStorage.removeItem("sap_user");
    localStorage.removeItem("sap_access_token");
    localStorage.removeItem("sap_refresh_token");
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem("sap_access_token"));
  const [loading, setLoading] = useState(false);

  const login = async ({ email, password }) => {
    setLoading(true);
    try {
      localStorage.removeItem("sap_access_token");
      localStorage.removeItem("sap_refresh_token");
      localStorage.removeItem("sap_user");
      setToken(null);
      setUser(null);

      const { data } = await api.post("/auth/token/", { email, password });
      localStorage.setItem("sap_access_token", data.access);
      localStorage.setItem("sap_refresh_token", data.refresh);
      setToken(data.access);

      const profile = data.user || { nome: email, email, tipo_usuario: "administrador" };
      localStorage.setItem("sap_user", JSON.stringify(profile));
      setUser(profile);
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("sap_access_token");
    localStorage.removeItem("sap_refresh_token");
    localStorage.removeItem("sap_user");
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const handleAuthExpired = () => logout();
    window.addEventListener("sap:auth-expired", handleAuthExpired);
    return () => window.removeEventListener("sap:auth-expired", handleAuthExpired);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      isAuthenticated: Boolean(token),
    }),
    [user, loading, token],
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
