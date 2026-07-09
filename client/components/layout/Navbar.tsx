"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  LayoutDashboard,
  ClipboardList,
  User,
  LogOut,
  Menu,
  X,
  Calendar,
  BarChart3,
  Clock,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import NotificationBell from "@/components/notifications/NotificationBell";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setThemeOpen(false);
      }
    }
    if (themeOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [themeOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (!isAuthenticated) return null;

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/reminders", label: "Reminders", icon: ClipboardList },
    { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  ];

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  const themeOptions = [
    { value: "light" as const, icon: Sun, label: "Light" },
    { value: "dark" as const, icon: Moon, label: "Dark" },
    { value: "system" as const, icon: Monitor, label: "System" },
  ];

  return (
    <nav
      className="glass sticky top-0 z-50 border-b"
      style={{ borderColor: "var(--border-default)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-[var(--color-primary)] flex items-center justify-center shadow-lg shadow-blue-500/25 transition-transform group-hover:scale-105">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <span
              className="text-lg font-bold hidden sm:inline tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Student Reminder
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1 p-1 rounded-2xl" style={{ background: "var(--bg-tertiary)" }}>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{
                    color: active ? "var(--color-primary)" : "var(--text-secondary)",
                    background: active ? "var(--bg-card)" : "transparent",
                    boxShadow: active ? "var(--shadow-sm)" : "none",
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-1">
            {/* Theme Toggle */}
            <div className="relative" ref={themeRef}>
              <button
                onClick={() => setThemeOpen(!themeOpen)}
                className="p-2.5 rounded-xl transition-colors hover:bg-[var(--surface-hover)]"
                style={{ color: "var(--text-secondary)" }}
                aria-label="Toggle theme"
              >
                {resolvedTheme === "dark" ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </button>
              <AnimatePresence>
                {themeOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-40 rounded-2xl shadow-xl border py-1 z-50"
                    style={{
                      background: "var(--bg-card)",
                      borderColor: "var(--border-default)",
                    }}
                  >
                    {themeOptions.map((opt) => {
                      const Icon = opt.icon;
                      const isActiveTheme = theme === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setTheme(opt.value);
                            setThemeOpen(false);
                          }}
                          className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm transition-colors"
                          style={{
                            color: isActiveTheme ? "var(--color-primary)" : "var(--text-secondary)",
                            background: isActiveTheme ? "var(--color-primary-light)" : "transparent",
                          }}
                        >
                          <Icon className="h-4 w-4" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Profile */}
            <Link
              href="/profile"
              className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors hover:bg-[var(--surface-hover)]"
            >
              <div
                className="h-8 w-8 rounded-xl flex items-center justify-center text-white text-sm font-semibold"
                style={{ background: "var(--color-primary)" }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </Link>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2.5 rounded-xl transition-colors hover:bg-[var(--surface-hover)]"
              style={{ color: "var(--text-secondary)" }}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t overflow-hidden"
            style={{
              borderColor: "var(--border-default)",
              background: "var(--bg-card)",
            }}
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                    style={{
                      color: active ? "var(--color-primary)" : "var(--text-secondary)",
                      background: active ? "var(--color-primary-light)" : "transparent",
                    }}
                  >
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                );
              })}

              {/* Theme Toggle Mobile */}
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>Theme</span>
                <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "var(--bg-tertiary)" }}>
                  {themeOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isActiveTheme = theme === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setTheme(opt.value)}
                        className="p-2 rounded-lg transition-all"
                        style={{
                          background: isActiveTheme ? "var(--bg-card)" : "transparent",
                          color: isActiveTheme ? "var(--color-primary)" : "var(--text-tertiary)",
                          boxShadow: isActiveTheme ? "var(--shadow-sm)" : "none",
                        }}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                <User className="h-5 w-5" />
                Profile
              </Link>

              <button
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all"
                style={{ color: "var(--color-danger)" }}
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
