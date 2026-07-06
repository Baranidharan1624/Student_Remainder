"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Mail,
  Bell,
  Calendar,
  LogOut,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Settings,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Loader from "@/components/ui/Loader";
import ErrorState from "@/components/ui/ErrorState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { User as UserType } from "@/types";

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(1, "New password is required")
      .min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

function ProfileContent() {
  const { logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const { data } = await authAPI.getProfile();
        if (!cancelled && data.success) {
          setProfile(data.user);
        }
      } catch {
        if (!cancelled) setError("Failed to load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleChangePassword = async (data: ChangePasswordFormData) => {
    try {
      const response = await authAPI.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setShowPasswordModal(false);
        reset();
        logout();
        router.push("/login");
      }
    } catch (err: unknown) {
      type ErrWithResponse = { response?: { data?: { message?: string } } };
      const message =
        typeof err === "object" && err !== null && "response" in err
          ? (err as ErrWithResponse).response?.data?.message
          : undefined;
      toast.error(message || "Failed to change password");
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const infoItems = profile
    ? [
        { icon: User, label: "Full Name", value: profile.name },
        { icon: Mail, label: "Email Address", value: profile.email },
        { icon: Bell, label: "Notifications", value: profile.notificationEnabled ? "Enabled" : "Disabled" },
        ...(profile.createdAt ? [{ icon: Calendar, label: "Member Since", value: formatDateTime(profile.createdAt) }] : []),
      ]
    : [];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-secondary)" }}>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>My Profile</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Manage your account settings
          </p>
        </div>

        {loading ? (
          <div
            className="rounded-2xl border p-8"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-default)",
            }}
          >
            <div className="flex items-center justify-center py-12">
              <Loader size="md" text="Loading profile..." />
            </div>
          </div>
        ) : error ? (
          <div
            className="rounded-2xl border"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-default)",
            }}
          >
            <ErrorState message={error} onRetry={() => window.location.reload()} />
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Profile Card */}
            <div
              className="rounded-2xl border p-6 sm:p-8 animate-fade-in"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border-default)",
              }}
            >
              {/* Avatar & Name */}
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="h-20 w-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                    boxShadow: "0 8px 24px 0 rgba(37, 99, 235, 0.3)",
                  }}
                >
                  {profile.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                    {profile.name}
                  </h2>
                  <p style={{ color: "var(--text-secondary)" }}>{profile.email}</p>
                </div>
              </div>

              {/* Info List */}
              <div className="space-y-3">
                {infoItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-4 p-4 rounded-xl"
                      style={{ background: "var(--bg-tertiary)" }}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" style={{ color: "var(--text-tertiary)" }} />
                      <div>
                        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{item.label}</p>
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {item.value}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Settings Section */}
            <div
              className="rounded-2xl border p-6 sm:p-8 animate-fade-in"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border-default)",
                animationDelay: "100ms",
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Settings className="h-5 w-5" style={{ color: "var(--text-tertiary)" }} />
                <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  Settings
                </h3>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowPasswordModal(true)}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </div>
            </div>

            {/* Danger Zone */}
            <div
              className="rounded-2xl border p-6 sm:p-8 animate-fade-in"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--color-danger)",
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5" style={{ color: "var(--color-danger)" }} />
                <h3 className="text-lg font-semibold" style={{ color: "var(--color-danger)" }}>
                  Danger Zone
                </h3>
              </div>
              <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                Once you log out, you will need to sign in again to access your account.
              </p>
              <Button variant="danger" onClick={() => setShowLogoutConfirm(true)}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        ) : null}
      </main>

      {/* Change Password Modal */}
      <Modal
        open={showPasswordModal}
        title="Change Password"
        onClose={() => {
          setShowPasswordModal(false);
          reset();
        }}
      >
        <form
          onSubmit={handleSubmit(handleChangePassword)}
          className="space-y-4"
        >
          <div className="relative">
            <Input
              label="Current Password"
              type={showCurrentPassword ? "text" : "password"}
              placeholder="Enter current password"
              icon={<Lock className="h-4 w-4" />}
              error={errors.currentPassword?.message}
              {...register("currentPassword")}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-[38px] transition-colors"
              style={{ color: "var(--text-tertiary)" }}
            >
              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="New Password"
              type={showNewPassword ? "text" : "password"}
              placeholder="Enter new password"
              icon={<Shield className="h-4 w-4" />}
              error={errors.newPassword?.message}
              {...register("newPassword")}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-[38px] transition-colors"
              style={{ color: "var(--text-tertiary)" }}
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Confirm New Password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              icon={<Shield className="h-4 w-4" />}
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-[38px] transition-colors"
              style={{ color: "var(--text-tertiary)" }}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={isSubmitting}>
              Update Password
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowPasswordModal(false);
                reset();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Logout Confirmation */}
      <ConfirmDialog
        open={showLogoutConfirm}
        title="Logout"
        message="Are you sure you want to logout? You will need to sign in again to access your account."
        confirmLabel="Logout"
        variant="danger"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
