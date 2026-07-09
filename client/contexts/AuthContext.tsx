"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import api from "@/lib/api";
import type { User, LoginPayload, RegisterPayload } from "@/types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, check for existing token and validate it
  useEffect(() => {
    let mounted = true;
    const storedToken = localStorage.getItem("token");

    (async () => {
      if (storedToken) {
        try {
          const { data } = await api.get("/auth/profile");
          if (mounted) {
            if (data.success) {
              setUser(data.user);
              setToken(storedToken);
            } else {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
            }
          }
        } catch {
          if (mounted) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }
        }
      }
      if (mounted) setLoading(false);
    })();

    return () => { mounted = false; };
  }, []);

  // Login user and persist token
  const login = async (payload: LoginPayload) => {
    const { data } = await api.post("/auth/login", payload);
    if (data.success) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    }
  };

  // Register new user
  const register = async (payload: RegisterPayload) => {
    await api.post("/auth/register", payload);
  };

  // Logout and clear storage
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };
  // Update local user state
  const updateUser = (updatedUser: User) => {
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
