import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  withCredentials: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
});

let refreshPromise = null;
let csrfToken = window.sessionStorage.getItem("sap_csrf_token");

function clearSession() {
  csrfToken = null;
  window.sessionStorage.removeItem("sap_csrf_token");
  window.dispatchEvent(new Event("sap:auth-expired"));
}

function rememberCsrfToken(response) {
  const nextToken = response?.data?.csrfToken;
  if (nextToken) {
    csrfToken = nextToken;
    window.sessionStorage.setItem("sap_csrf_token", nextToken);
  }
  return response;
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
    const cookieToken = getCookie("csrftoken");
    const token = csrfToken || (cookieToken ? decodeURIComponent(cookieToken) : null);
    if (token) {
      config.headers = config.headers || {};
      config.headers["X-CSRFToken"] = token;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => rememberCsrfToken(response),
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
