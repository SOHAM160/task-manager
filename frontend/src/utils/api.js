import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const sessionId = sessionStorage.getItem("sessionId");
  if (sessionId) {
    config.headers["Session-ID"] = sessionId;
  }
  return config;
});

export default api;
