import axios from "axios";
import { getStoredToken, clearAuthSession } from "../utils/authSession";

const api = axios.create({
  baseURL: "https://site--api-v1--f5j2myk6jf8y.code.run/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const token = getStoredToken();
    const isInsideAdmin = window.location.pathname.startsWith("/admin");

    // Solo expulsa al login si estabas dentro de /admin con una sesión que caducó
    if (status === 401 && token && isInsideAdmin) {
      clearAuthSession();
      window.location.replace("/");
    }

    return Promise.reject(error);
  }
);

export default api;