import axios from "axios";

// One axios instance for the whole app: it adds the JWT to every request,
// so pages never build the Authorization header themselves.
const api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080"
});

api.interceptors.request.use((config) => {
      const token = localStorage.getItem("token");
      if (token) {
            config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
});

// An expired or invalid token comes back as 401 - send the user to the login page.
api.interceptors.response.use(
      (response) => response,
      (error) => {
            const isLoginCall = error.config?.url?.includes("/members/login");
            if (error.response?.status === 401 && !isLoginCall) {
                  clearSession();
                  window.location.href = "/";
            }
            return Promise.reject(error);
      }
);

export default api;

export const CURRENCY = "₹";

export function saveSession(data) {
      localStorage.setItem("token", data.token);
      localStorage.setItem(
            "user",
            JSON.stringify({ id: data.id, name: data.name, email: data.email, role: data.role })
      );
}

export function clearSession() {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
}

export function getUser() {
      try {
            return JSON.parse(localStorage.getItem("user"));
      } catch {
            return null;
      }
}

export function isStaff(user) {
      return !!user && (user.role === "ADMIN" || user.role === "LIBRARIAN");
}

// Backend errors are either { error: "..." } or { field: "message", ... } (validation).
export function errorMessage(err, fallback) {
      const data = err.response?.data;
      if (!data || typeof data !== "object") return fallback;
      if (data.error) return data.error;
      const messages = Object.values(data).filter((v) => typeof v === "string");
      return messages.length ? messages.join(". ") : fallback;
}

export function formatDate(iso) {
      if (!iso) return "-";
      return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
            day: "2-digit",
            month: "short",
            year: "numeric"
      });
}

export function money(value) {
      return `${CURRENCY}${Number(value || 0).toFixed(2)}`;
}
