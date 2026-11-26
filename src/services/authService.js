import api from "./api";
import { clearAuthSession } from "../utils/authSession";

// Iniciar sesión (el backend solo acepta email y password en minúsculas)
export const login = async (credentials) => {
  const email = (credentials.email || credentials.Email || "").trim();
  const password = credentials.password || credentials.Password || "";

  const response = await api.post("/auth/login", {
    email,
    password,
  });

  const data = response.data;
  const token =
    data?.token ||
    data?.access_token ||
    data?.accessToken ||
    data?.jwt ||
    data?.data?.token ||
    data?.data?.access_token;

  const user =
    data?.user ||
    data?.usuario ||
    data?.data?.user ||
    data?.data?.usuario ||
    null;

  if (token) {
    localStorage.setItem("token", token);
  }
  if (user && typeof user === "object") {
    localStorage.setItem("chapulgo_user", JSON.stringify(user));
  }

  return data;
};

export const loginUser = login;
export const loginAdmin = login;

// Registro de usuario normal
export const register = async (userData) => {
  const response = await api.post("/auth/register", userData);
  return response.data;
};
export const registerUser = register;

// Registro de administrador
export const registerAdmin = async (adminData) => {
  const response = await api.post("/auth/registerAdmin", adminData);
  return response.data;
};

// Obtener localidades (necesario para RegisterForm.jsx)
export const getLocalidades = async () => {
  const response = await api.get("/localidades");
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.localidades)) return data.localidades;
  return [];
};

export const getMunicipios = async () => {
  const response = await api.get("/municipios");
  const data = response.data;
  return Array.isArray(data) ? data : data?.data || [];
};

export const getEstados = async () => {
  const response = await api.get("/estados");
  const data = response.data;
  return Array.isArray(data) ? data : data?.data || [];
};

// Cerrar sesión
export const logout = () => {
  clearAuthSession();
};