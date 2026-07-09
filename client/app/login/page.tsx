"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bell, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      toast.success("Login successful!");
      router.push("/dashboard");
    } catch (error: unknown) {
      let message = "Login failed. Please try again.";
      
      if (typeof error === 'object' && error !== null) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = error as any;
        
        if (err.code === "ERR_NETWORK") {
          message = "Network Error: Cannot connect to the server. Please check your connection.";
        } else if (err.code === "ECONNABORTED") {
          message = "Connection timeout. The server took too long to respond.";
        } else if (err.response) {
          const status = err.response.status;
          if (status === 401 || status === 400) {
            message = err.response.data?.message || "Invalid credentials.";
          } else if (status >= 500) {
            message = "Server Error: Please try again later.";
          } else {
            message = err.response.data?.message || message;
          }
        } else if (err.message) {
          message = err.message;
        }
      }
      
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-secondary)]">
      <div className="w-full max-w-[400px] animate-fade-in flex flex-col items-center">
        
        {/* Logo & Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-[var(--color-primary)] shadow-md shadow-blue-500/20 mb-3">
            <Bell className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text-primary)] mb-1">
            Welcome Back
          </h1>
          <p className="text-[14px] text-[var(--text-secondary)] font-medium">
            Continue managing your reminders
          </p>
        </div>

        {/* Form Card */}
        <div className="w-full bg-[var(--bg-card)] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[var(--border-default)] p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Email */}
            <div className="space-y-1.5 relative group">
              <label className="text-[13px] font-bold text-[var(--text-secondary)]">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors">
                  <Mail className={`h-[18px] w-[18px] ${errors.email ? 'text-red-500' : dirtyFields.email && !errors.email ? 'text-green-500' : 'text-gray-400 group-focus-within:text-[var(--color-primary)]'} transition-colors`} />
                </div>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 bg-[var(--bg-tertiary)] border ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : dirtyFields.email && !errors.email ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20' : 'border-[var(--border-default)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20'} rounded-xl text-[14px] font-medium text-[var(--text-primary)] placeholder-gray-400 transition-all focus:outline-none focus:ring-4`}
                  {...register("email")}
                />
                {dirtyFields.email && !errors.email && (
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                    <CheckCircle2 className="h-[18px] w-[18px] text-green-500 animate-in fade-in" />
                  </div>
                )}
              </div>
              {errors.email && (
                <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                  <p className="text-[12px] text-red-500 font-medium">{errors.email.message}</p>
                </div>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5 relative group">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-bold text-[var(--text-secondary)]">
                  Password
                </label>
                <button
                  type="button"
                  className="text-[12px] font-bold text-[var(--color-primary)] hover:text-blue-700 transition-colors"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors">
                  <Lock className={`h-[18px] w-[18px] ${errors.password ? 'text-red-500' : dirtyFields.password && !errors.password ? 'text-green-500' : 'text-gray-400 group-focus-within:text-[var(--color-primary)]'} transition-colors`} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  className={`w-full pl-10 pr-10 py-2.5 bg-[var(--bg-tertiary)] border ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : dirtyFields.password && !errors.password ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20' : 'border-[var(--border-default)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20'} rounded-xl text-[14px] font-medium text-[var(--text-primary)] placeholder-gray-400 transition-all focus:outline-none focus:ring-4`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[var(--text-primary)] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-[18px] w-[18px] animate-in zoom-in" /> : <Eye className="h-[18px] w-[18px] animate-in zoom-in" />}
                </button>
              </div>
              {errors.password && (
                <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                  <p className="text-[12px] text-red-500 font-medium">{errors.password.message}</p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full py-2.5 text-[14px] font-bold rounded-xl shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all"
                loading={isSubmitting}
              >
                Sign In
              </Button>
            </div>
          </form>

          {/* Footer Link */}
          <div className="mt-6 pt-5 border-t border-[var(--border-light)] text-center">
            <p className="text-[13px] font-medium text-[var(--text-secondary)]">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-bold text-[var(--color-primary)] hover:text-blue-700 transition-colors"
              >
                Create one
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
