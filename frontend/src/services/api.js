import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  withCredentials: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
});

let refreshPromise = null;

function clearSession() {
  window.dispatchEvent(new Event("sap:auth-expired"));
}

function getCookie(name) {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
}

api.interceptors.request.use((config) => {
  const method = (config.method || "get").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS", "TRACE"].includes(method)) {
    const csrfToken = getCookie("csrftoken");
    if (csrfToken) {
      config.headers["X-CSRFToken"] = decodeURIComponent(csrfToken);
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isRefreshRequest = originalRequest?.url?.includes("/auth/token/refresh/");
    const isLoginRequest = originalRequest?.url?.includes("/auth/token/");
    const isLogoutRequest = originalRequest?.url?.includes("/auth/logout/");

    if (error.response?.status === 401 && !originalRequest?._retry && !isRefreshRequest && !isLoginRequest && !isLogoutRequest) {
      originalRequest._retry = true;

      try {
        refreshPromise ||= api.post("/auth/token/refresh/");
        await refreshPromise;
        return api(originalRequest);
      } catch (refreshError) {
        clearSession();
        return Promise.reject(refreshError);
      } finally {
        refreshPromise = null;
      }
    }

    if (error.response?.status === 401) {
      clearSession();
    }
    return Promise.reject(error);
  },
);

export default api;
