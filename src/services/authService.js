import API from "./api";

export const loginUser = async (credentials) => {
  const response = await API.post("/auth/login", credentials);
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await API.post("/auth/register", userData);
  return response.data;
};

export const registerAdmin = async (adminData) => {
  const response = await API.post("/auth/registerAdmin", adminData);
  return response.data;
};

export const getLocalidades = async () => {
  const response = await API.get("/localidades");
  return response.data;
};