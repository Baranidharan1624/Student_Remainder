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
import type { User as UserType } from "@/types";

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Change Password Schema
const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(1, "New password is required")
      .min(6, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your password"),
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
const handleChangePassword = async (
  data: ChangePasswordFormData
) => {
  try {
    const response = await authAPI.changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });

    if (response.data.success) {
      toast.success(response.data.message);

      setShowPasswordModal(false);

      reset();

      // Optional: force re-login after password change
      logout();
      router.push("/login");
    }
  } catch (err: unknown) {
    // Safely extract message from unknown error without using `any`
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center justify-center py-12">
              <Loader size="md" text="Loading profile..." />
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <ErrorState message={error} onRetry={() => window.location.reload()} />
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              {/* Avatar & Name */}
              <div className="flex items-center gap-4 mb-6">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/25">
                  {profile.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {profile.name}
                  </h2>
                  <p className="text-gray-500">{profile.email}</p>
                </div>
              </div>

              {/* Info List */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <User className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Full Name</p>
                    <p className="text-sm font-medium text-gray-900">
                      {profile.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Email Address</p>
                    <p className="text-sm font-medium text-gray-900">
                      {profile.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <Bell className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Notifications</p>
                    <p className="text-sm font-medium text-gray-900">
                      {profile.notificationEnabled ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                </div>

                {profile.createdAt && (
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <Calendar className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Member Since</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDateTime(profile.createdAt)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Account Actions
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowPasswordModal(true)}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
                <Button variant="danger" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
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
              className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
            >
              {showCurrentPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
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
              className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
            >
              {showNewPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
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
              className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
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
