import axios from "axios";

const API = axios.create({
  baseURL: "https://site--api-v1--f5j2myk6jf8y.code.run/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use((config) => {
  const rawToken = localStorage.getItem("token");
  if (rawToken) {
    const cleanToken = rawToken.replace(/^"|"$/g, "").trim();
    config.headers.Authorization = `Bearer ${cleanToken}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = error.config?.url?.includes("/auth/");
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default API;