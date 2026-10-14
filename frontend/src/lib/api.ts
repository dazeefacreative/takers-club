import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 15000,
});

// Auto-attach the admin JWT from localStorage (shoppers never have one)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("tc_token");
  if (token && token !== "undefined") config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Expired/invalid admin session — clear it and send them back to the admin login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem("tc_token")) {
      localStorage.removeItem("tc_token");
      localStorage.removeItem("tc_user");
      window.location.href = "/admin/login";
    }
    return Promise.reject(err);
  }
);

export default api;
