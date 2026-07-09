"use client";

import React, { useState, useEffect } from "react";
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
  Monitor,
  Sun,
  Moon,
  Clock,
  Globe,
  Trash2,
  Camera,
  ShieldCheck,
  Smartphone,
  Key,
  AlertTriangle
} from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
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

function getYearsSince(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - d.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 365) return "New Member";
  return `${Math.floor(diffDays / 365)} Year Member`;
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
  const { logout, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  
  const [profile, setProfile] = useState<UserType | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editWhatsappNumber, setEditWhatsappNumber] = useState("");
  const [editPreferredMethod, setEditPreferredMethod] = useState<"Email" | "WhatsApp" | "Both">("Email");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // UI state for premium dummy features
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("12h");
  
  // Avatar upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
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
          setEditName(data.user.name);
          setEditEmail(data.user.email);
          setEditWhatsappNumber(data.user.whatsappNumber || "");
          setEditPreferredMethod(data.user.preferredReminderMethod || "Email");
        }
      } catch {
        if (!cancelled) setError("Failed to load profile data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    if (!editEmail.trim()) {
      toast.error("Email cannot be empty");
      return;
    }
    
    try {
      setIsSavingProfile(true);
      const { data } = await authAPI.updateProfile({ 
        name: editName, 
        email: editEmail,
        whatsappNumber: editWhatsappNumber,
        preferredReminderMethod: editPreferredMethod
      });
      if (data.success) {
        setProfile(data.user);
        updateUser(data.user);
        toast.success("Profile updated successfully");
        setIsEditing(false);
      }
    } catch (err: unknown) {
      type ErrWithResponse = { response?: { data?: { message?: string } } };
      const message =
        typeof err === "object" && err !== null && "response" in err
          ? (err as ErrWithResponse).response?.data?.message
          : undefined;
      toast.error(message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size (max 5MB)
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    try {
      setIsUploadingAvatar(true);
      
      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64Avatar = reader.result as string;
        
        // Update profile
        const { data } = await authAPI.updateProfile({
          name: profile!.name,
          email: profile!.email,
          whatsappNumber: profile!.whatsappNumber,
          preferredReminderMethod: profile!.preferredReminderMethod,
          avatar: base64Avatar
        });

        if (data.success) {
          setProfile(data.user);
          updateUser(data.user);
          toast.success("Avatar updated successfully");
        }
      };
      
      reader.onerror = () => {
        toast.error("Failed to read image file");
      };
    } catch (err: unknown) {
      toast.error("Failed to update avatar");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleChangePassword = async (data: ChangePasswordFormData) => {
    try {
      const response = await authAPI.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (response.data.success) {
        toast.success("Password updated successfully");
        setShowPasswordModal(false);
        reset();
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

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }
    try {
      setIsDeleting(true);
      const { data } = await authAPI.deleteAccount();
      if (data.success) {
        toast.success("Account deleted successfully");
        logout();
        router.push("/login");
      }
    } catch (err: unknown) {
      type ErrWithResponse = { response?: { data?: { message?: string } } };
      const message =
        typeof err === "object" && err !== null && "response" in err
          ? (err as ErrWithResponse).response?.data?.message
          : undefined;
      toast.error(message || "Failed to delete account");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const cardStyle = {
    background: "var(--bg-card)",
    border: "1px solid var(--border-light)",
    boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
    borderRadius: "20px"
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-secondary)" }}>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Page Header */}
        <div className="mb-10 animate-fade-in max-w-2xl">
          <p className="text-[13px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: "var(--text-muted)" }}>
            Settings
          </p>
          <h1 className="text-[36px] sm:text-[48px] font-extrabold tracking-tight mb-4" style={{ color: "var(--text-primary)", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            Account Management
          </h1>
          <p className="text-[16px]" style={{ color: "var(--text-secondary)", fontWeight: 400, lineHeight: 1.6 }}>
            Manage your personal information, security preferences, and account settings.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20" style={cardStyle}>
            <Loader size="md" text="Loading profile..." />
          </div>
        ) : error ? (
          <div style={cardStyle}>
            <ErrorState message={error} onRetry={() => window.location.reload()} />
          </div>
        ) : profile ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* --- LEFT COLUMN: Profile Info --- */}
            <div className="lg:col-span-4 flex flex-col gap-8">
              
              {/* Premium Hero Card */}
              <div 
                className="p-8 text-center flex flex-col items-center justify-center animate-fade-in transition-all hover:shadow-md"
                style={cardStyle}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                <div 
                  className="h-28 w-28 rounded-full flex items-center justify-center text-white text-[40px] font-extrabold shadow-lg mb-5 relative group cursor-pointer overflow-hidden"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: profile.avatar ? `url(${profile.avatar}) center/cover no-repeat` : "linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary) 100%)",
                    boxShadow: "0 12px 32px rgba(59, 130, 246, 0.25)",
                  }}
                >
                  {!profile.avatar && profile.name?.charAt(0).toUpperCase()}
                  
                  {isUploadingAvatar ? (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center backdrop-blur-sm">
                      <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin mb-1" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 backdrop-blur-sm">
                      <Camera className="h-6 w-6 text-white" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white">Change</span>
                    </div>
                  )}
                </div>

                {!isEditing ? (
                  <>
                    <h2 className="text-[22px] font-extrabold tracking-tight mb-1" style={{ color: "var(--text-primary)" }}>
                      {profile.name}
                    </h2>
                    <p className="text-[14px] mb-6" style={{ color: "var(--text-secondary)" }}>{profile.email}</p>
                    <Button 
                      className="w-full text-[14px] font-bold py-3 rounded-xl transition-all hover:-translate-y-0.5"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Profile
                    </Button>
                  </>
                ) : (
                  <div className="w-full flex flex-col gap-3 animate-fade-in">
                    <div className="text-left">
                      <label className="text-[12px] font-bold uppercase text-[var(--text-secondary)] mb-1 block">Full Name</label>
                      <Input 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Your name"
                      />
                    </div>
                    <div className="text-left">
                      <label className="text-[12px] font-bold uppercase text-[var(--text-secondary)] mb-1 block">Email</label>
                      <Input 
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="Your email"
                      />
                    </div>
                    <div className="text-left">
                      <label className="text-[12px] font-bold uppercase text-[var(--text-secondary)] mb-1 block">WhatsApp Number</label>
                      <Input 
                        value={editWhatsappNumber}
                        onChange={(e) => setEditWhatsappNumber(e.target.value)}
                        placeholder="+919876543210"
                      />
                    </div>
                    <div className="text-left">
                      <label className="text-[12px] font-bold uppercase text-[var(--text-secondary)] mb-1 block">Preferred Reminder Method</label>
                      <select
                        value={editPreferredMethod}
                        onChange={(e) => setEditPreferredMethod(e.target.value as any)}
                        className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-xl text-[14px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                      >
                        <option value="Email">Email</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Both">Both (Email & WhatsApp)</option>
                      </select>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button 
                        className="flex-1 text-[13px] font-bold py-2.5 rounded-xl"
                        onClick={handleSaveProfile}
                        loading={isSavingProfile}
                      >
                        Save
                      </Button>
                      <Button 
                        variant="secondary"
                        className="flex-1 text-[13px] font-bold py-2.5 rounded-xl"
                        onClick={() => {
                          setEditName(profile.name);
                          setEditEmail(profile.email);
                          setEditWhatsappNumber(profile.whatsappNumber || "");
                          setEditPreferredMethod(profile.preferredReminderMethod || "Email");
                          setIsEditing(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Personal Information */}
              <div className="p-6 animate-fade-in transition-all hover:shadow-md space-y-2" style={{ ...cardStyle, animationDelay: "100ms" }}>
                <h3 className="text-[13px] font-bold uppercase tracking-wider mb-4 px-2" style={{ color: "var(--text-muted)" }}>Personal Info</h3>
                
                <div className="flex items-center gap-4 p-4 rounded-xl transition-colors hover:bg-[var(--surface-hover)]">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-[var(--bg-tertiary)] flex-shrink-0">
                    <User className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold uppercase" style={{ color: "var(--text-tertiary)" }}>Full Name</p>
                    <p className="text-[15px] font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>{profile.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 rounded-xl transition-colors hover:bg-[var(--surface-hover)]">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-[var(--bg-tertiary)] flex-shrink-0">
                    <Mail className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold uppercase" style={{ color: "var(--text-tertiary)" }}>Email Address</p>
                    <p className="text-[15px] font-bold mt-0.5 truncate max-w-[200px]" style={{ color: "var(--text-primary)" }}>{profile.email}</p>
                  </div>
                </div>

                {profile.whatsappNumber && (
                  <div className="flex items-center gap-4 p-4 rounded-xl transition-colors hover:bg-[var(--surface-hover)]">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center bg-[var(--bg-tertiary)] flex-shrink-0">
                      <Smartphone className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
                    </div>
                    <div>
                      <p className="text-[12px] font-bold uppercase" style={{ color: "var(--text-tertiary)" }}>WhatsApp Number</p>
                      <p className="text-[15px] font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>{profile.whatsappNumber}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 p-4 rounded-xl transition-colors hover:bg-[var(--surface-hover)]">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-[var(--bg-tertiary)] flex-shrink-0">
                    <Bell className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold uppercase" style={{ color: "var(--text-tertiary)" }}>Notification Method</p>
                    <p className="text-[15px] font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>{profile.preferredReminderMethod || "Email"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-xl transition-colors hover:bg-[var(--surface-hover)]">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-[var(--bg-tertiary)] flex-shrink-0">
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold uppercase" style={{ color: "var(--text-tertiary)" }}>Email Verification</p>
                    <p className="text-[15px] font-bold mt-0.5 text-green-500">Verified</p>
                  </div>
                </div>

                {profile.createdAt && (
                  <div className="flex items-center gap-4 p-4 rounded-xl transition-colors hover:bg-[var(--surface-hover)]">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center bg-[var(--bg-tertiary)] flex-shrink-0">
                      <Calendar className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
                    </div>
                    <div>
                      <p className="text-[12px] font-bold uppercase" style={{ color: "var(--text-tertiary)" }}>Joined Date</p>
                      <p className="text-[15px] font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>{formatDateTime(profile.createdAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* --- RIGHT COLUMN: Overview & Settings --- */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              

              {/* Security */}
              <div className="p-6 animate-fade-in transition-all hover:shadow-md" style={{ ...cardStyle, animationDelay: "200ms" }}>
                <h3 className="text-[13px] font-bold uppercase tracking-wider mb-6 px-2" style={{ color: "var(--text-muted)" }}>Security</h3>
                
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl transition-colors hover:bg-[var(--surface-hover)]">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center bg-[var(--bg-tertiary)] flex-shrink-0">
                        <Key className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
                      </div>
                      <div>
                        <p className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>Change Password</p>
                        <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>Last changed: Never</p>
                      </div>
                    </div>
                    <Button variant="secondary" onClick={() => setShowPasswordModal(true)} className="sm:w-auto w-full text-[13px] font-bold py-2 px-5">
                      Update
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl transition-colors hover:bg-[var(--surface-hover)]">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center bg-[var(--bg-tertiary)] flex-shrink-0">
                        <Shield className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
                      </div>
                      <div>
                        <p className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>Two-Factor Authentication</p>
                        <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>Add an extra layer of security</p>
                      </div>
                    </div>
                    <span className="text-[12px] font-bold bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 px-3 py-1 rounded-md whitespace-nowrap">
                      Coming Soon
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl transition-colors hover:bg-[var(--surface-hover)]">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center bg-[var(--bg-tertiary)] flex-shrink-0">
                        <Smartphone className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
                      </div>
                      <div>
                        <p className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>Active Device</p>
                        <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>Current Session (Windows / Chrome)</p>
                      </div>
                    </div>
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </div>


              {/* Danger Zone */}
              <div 
                className="p-6 rounded-[20px] transition-all animate-fade-in"
                style={{
                  background: "transparent",
                  border: "1px solid var(--border-default)",
                  animationDelay: "300ms"
                }}
              >
                <div className="flex items-center gap-2 mb-6 px-2">
                  <Shield className="h-5 w-5 text-gray-500" />
                  <h3 className="text-[13px] font-bold uppercase tracking-wider text-gray-500">
                    Danger Zone
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-transparent hover:border-[var(--border-light)] transition-colors">
                    <div>
                      <p className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>Logout</p>
                      <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>Sign out of your account on this device</p>
                    </div>
                    <Button variant="outline" onClick={handleLogout} className="sm:w-auto w-full text-[13px] font-bold py-2.5 px-6 rounded-xl border-[var(--border-default)] hover:bg-[var(--surface-hover)]">
                      <LogOut className="h-4 w-4 mr-2" /> Logout
                    </Button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 transition-colors">
                    <div>
                      <p className="text-[15px] font-bold text-red-600 dark:text-red-400">Delete Account</p>
                      <p className="text-[13px] text-red-600/80 dark:text-red-400/80">Permanently delete your account and all data</p>
                    </div>
                    <Button variant="danger" onClick={() => setShowDeleteConfirm(true)} className="sm:w-auto w-full text-[13px] font-bold py-2.5 px-6 rounded-xl shadow-sm hover:shadow-md">
                      <Trash2 className="h-4 w-4 mr-2" /> Delete Account
                    </Button>
                  </div>
                </div>
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

          <div className="flex items-center gap-3 pt-4">
            <Button type="submit" loading={isSubmitting} className="flex-1 py-3 font-bold rounded-xl">
              Update Password
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowPasswordModal(false);
                reset();
              }}
              className="flex-1 py-3 font-bold rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        open={showDeleteConfirm}
        title="Delete Account"
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteConfirmationText("");
        }}
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div>
                <h4 className="text-[14px] font-bold text-red-800 dark:text-red-300">This action is permanent and cannot be undone.</h4>
                <p className="text-[13px] text-red-700/80 dark:text-red-400/80 mt-1">
                  All your reminders, statistics, and personal information will be permanently removed from our servers.
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <label className="text-[13px] font-bold text-[var(--text-primary)] block mb-2">
              Please type <span className="text-red-500">DELETE</span> to confirm
            </label>
            <Input 
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="DELETE"
              className="font-mono tracking-widest text-center"
            />
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button 
              variant="danger" 
              className="flex-1 py-3 font-bold rounded-xl disabled:opacity-50"
              onClick={handleDeleteAccount}
              loading={isDeleting}
              disabled={deleteConfirmationText !== "DELETE"}
            >
              Confirm Delete
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteConfirmationText("");
              }}
              className="flex-1 py-3 font-bold rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </div>
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
