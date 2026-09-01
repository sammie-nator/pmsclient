import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:4100/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Every request carries who's acting and in what role, read from
// localStorage (set by the role picker). There's no JWT yet, so this is
// how the backend knows to enforce admin/agent/frontdesk permissions.
api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem("pms_actor");
    const actor = raw ? JSON.parse(raw) : null;
    if (actor) {
      config.headers["x-role"] = actor.role;
      config.headers["x-actor-name"] = actor.name;
    }
  } catch {
    // ignore malformed storage
  }
  return config;
});

export default api;
