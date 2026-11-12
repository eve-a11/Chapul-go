import axios from 'axios';

const API = axios.create({
  baseURL: 'https://site--api-v1--f5j2myk6jf8y.code.run/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;