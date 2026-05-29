import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "" : "http://localhost:3001");

const api = axios.create({
  baseURL,
  timeout: 10000,
});

export default api;
