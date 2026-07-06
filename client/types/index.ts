// ==========================================
// User & Auth Types
// ==========================================

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  notificationEnabled?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface ApiError {
  success: boolean;
  message: string;
}

// ==========================================
// Reminder Types
// ==========================================

export type Category = "Assignment" | "Exam" | "Project" | "Lab" | "Class" | "Personal" | "Meeting" | "Other";
export type Priority = "Low" | "Medium" | "High";

export interface Reminder {
  _id: string;
  user: string;
  title: string;
  description: string;
  subject: string;
  category: Category;
  priority: Priority;
  dueDate: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderPayload {
  title: string;
  description?: string;
  subject?: string;
  category?: Category;
  priority?: Priority;
  dueDate: string;
}

export type UpdateReminderPayload = Partial<CreateReminderPayload> & {
  completed?: boolean;
};

// ==========================================
// Dashboard Types
// ==========================================

export interface DashboardStatistics {
  totalReminders: number;
  completed: number;
  pending: number;
  highPriority: number;
  dueToday: number;
  overdue: number;
}

export interface DashboardResponse {
  success: boolean;
  statistics: DashboardStatistics;
}

// ==========================================
// Reminder List Response
// ==========================================

export interface ReminderListResponse {
  success: boolean;
  page: number;
  totalPages: number;
  totalItems: number;
  count: number;
  reminders: Reminder[];
}

// ==========================================
// Filter & Sort Types
// ==========================================

export interface ReminderFilters {
  priority?: Priority;
  category?: Category;
  completed?: string;
  sort?: string;
  page?: number;
  limit?: number;
  keyword?: string;
}

export const CATEGORIES: Category[] = [
  "Assignment",
  "Exam",
  "Project",
  "Lab",
  "Class",
  "Personal",
  "Meeting",
  "Other",
];

export const PRIORITIES: Priority[] = ["Low", "Medium", "High"];

export const SORT_OPTIONS = [
  { value: "dueDate", label: "Due Date" },
  { value: "-dueDate", label: "Due Date (Descending)" },
  { value: "priority", label: "Priority" },
  { value: "-priority", label: "Priority (Descending)" },
  { value: "createdAt", label: "Created Date" },
  { value: "-createdAt", label: "Created Date (Descending)" },
] as const;
