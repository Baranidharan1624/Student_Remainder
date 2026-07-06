import axios from "axios";
import type {
  Reminder,
  CreateReminderPayload,
  UpdateReminderPayload,
  ReminderFilters,
  DashboardResponse,
  ReminderListResponse,
  User,
} from "@/types";

const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every request automatically
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 Unauthorized globally — auto logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ==========================================
// Auth API
// ==========================================
export const authAPI = {
  // Register
  register: (data: {
    name: string;
    email: string;
    password: string;
  }) =>
    api.post("/auth/register", data),

  // Login
  login: (data: {
    email: string;
    password: string;
  }) =>
    api.post("/auth/login", data),

  // Get Profile
  getProfile: () =>
    api.get<{ success: boolean; user: User }>("/auth/profile"),

  // Change Password
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }) =>
    api.put("/auth/change-password", data),
};

// ==========================================
// Dashboard API
// ==========================================

export const dashboardAPI = {
  getStats: () => api.get<DashboardResponse>("/reminders/dashboard"),
};

// ==========================================
// Reminders API
// ==========================================

export const remindersAPI = {
  // Get all reminders with filters, sort, pagination
  getAll: (filters?: ReminderFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    return api.get<ReminderListResponse>(
      `/reminders?${params.toString()}`
    );
  },

  // Get single reminder by ID
  getById: (id: string) =>
    api.get<{ success: boolean; reminder: Reminder }>(`/reminders/${id}`),

  // Create new reminder
  create: (payload: CreateReminderPayload) =>
    api.post<{ success: boolean; message: string; reminder: Reminder }>(
      "/reminders",
      payload
    ),

  // Update existing reminder
  update: (id: string, payload: UpdateReminderPayload) =>
    api.put<{ success: boolean; message: string; reminder: Reminder }>(
      `/reminders/${id}`,
      payload
    ),

  // Delete reminder
  delete: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/reminders/${id}`),

  // Search reminders
  search: (keyword: string) =>
    api.get<{ success: boolean; count: number; reminders: Reminder[] }>(
      `/reminders/search?keyword=${encodeURIComponent(keyword)}`
    ),
};

export default api;
