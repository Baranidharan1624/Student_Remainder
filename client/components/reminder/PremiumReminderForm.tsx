"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Flag,
  Bell,
  Sparkles,
  Save,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { remindersAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Loader from "@/components/ui/Loader";
import ErrorState from "@/components/ui/ErrorState";
import { type Category, type Priority } from "@/types";

/* ──────────────────────────── helpers ──────────────────────────── */

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getCurrentTimeStr() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateDisplay(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function formatTimeDisplay(timeStr: string) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

function getCountdown(dateStr: string, timeStr: string) {
  if (!dateStr || !timeStr) return "";
  const now = new Date();
  const target = new Date(`${dateStr}T${timeStr}:00`);
  const diffMs = target.getTime() - now.getTime();
  if (diffMs < 0) return "Overdue";
  const diffMins = Math.floor(diffMs / 60000);
  const days = Math.floor(diffMins / (24 * 60));
  const hours = Math.floor((diffMins % (24 * 60)) / 60);
  const mins = diffMins % 60;
  if (days > 0) return `Starts in ${days}d ${hours}h`;
  if (hours > 0) return `Starts in ${hours}h ${mins}m`;
  return `Starts in ${mins}m`;
}

/* ──────────────────────────── constants ──────────────────────────── */

const PRIORITY_OPTIONS = [
  { value: "Low", label: "Low", color: "#22C55E", bg: "#DCFCE7" },
  { value: "Medium", label: "Medium", color: "#F97316", bg: "#FFF7ED" },
  { value: "High", label: "High", color: "#EF4444", bg: "#FEE2E2" },
] as const;

const CATEGORY_OPTIONS = [
  { value: "Assignment", label: "Assignment", emoji: "📝" },
  { value: "Exam", label: "Exam", emoji: "📋" },
  { value: "Project", label: "Project", emoji: "🚀" },
  { value: "Lab", label: "Lab", emoji: "🔬" },
  { value: "Class", label: "Class", emoji: "📚" },
  { value: "Personal", label: "Personal", emoji: "👤" },
  { value: "Meeting", label: "Meeting", emoji: "🤝" },
  { value: "Other", label: "Other", emoji: "📌" },
] as const;

const DATE_PRESETS = [
  { label: "Today", offset: 0 },
  { label: "Tomorrow", offset: 1 },
  { label: "Next Week", offset: 7 },
] as const;

const TIME_PRESETS = [
  { label: "Morning", time: "09:00", emoji: "🌅" },
  { label: "Afternoon", time: "14:00", emoji: "☀️" },
  { label: "Evening", time: "18:00", emoji: "🌆" },
  { label: "Night", time: "21:00", emoji: "🌙" },
] as const;

const NOTIFICATION_METHOD_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
] as const;

/* ──────────────────────────── schema ──────────────────────────── */

function buildSchema(isEdit: boolean) {
  const base = z.object({
    title: z.string().min(1, "Title is required").max(100, "Title is too long"),
    description: z.string().optional(),
    subject: z.string().min(1, "Subject is required"),
    category: z.string().min(1, "Category is required"),
    priority: z.string().min(1, "Priority is required"),
    dueDate: z.string().min(1, "Due date is required"),
    dueTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Valid time is required"),
    completed: z.boolean().optional(),
    reminderSchedule: z.array(z.object({
      date: z.string().min(1, "Date is required"),
      time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Valid time is required")
    })).min(1, "At least one reminder is required").max(5, "Maximum 5 reminders allowed")
  });

  return base.superRefine((data, ctx) => {
    // Validate target due date/time is in future (for create)
    const targetTimeMs = new Date(`${data.dueDate}T${data.dueTime}:00`).getTime();
    if (!isEdit && targetTimeMs < Date.now()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Deadline cannot be in the past", path: ["dueDate"] });
    }

    // Validate reminder schedules
    const seen = new Set<string>();
    data.reminderSchedule.forEach((sch, i) => {
      const schTimeMs = new Date(`${sch.date}T${sch.time}:00`).getTime();
      const schKey = `${sch.date}T${sch.time}`;
      
      if (!isEdit && schTimeMs <= Date.now()) {
         ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Reminder must be in the future.", path: ["reminderSchedule", i, "date"] });
      }
      
      if (schTimeMs >= targetTimeMs) {
         ctx.addIssue({ code: z.ZodIssueCode.custom, message: "This reminder must occur before the due date.", path: ["reminderSchedule", i, "date"] });
      }

      if (seen.has(schKey)) {
         ctx.addIssue({ code: z.ZodIssueCode.custom, message: "You already created a reminder at this time.", path: ["reminderSchedule", i, "time"] });
      }
      seen.add(schKey);
    });
  });
}

type ReminderFormData = z.infer<ReturnType<typeof buildSchema>>;

/* ──────────────────────────── subcomponents ──────────────────────────── */

function FormCard({
  icon,
  title,
  subtitle,
  children,
  delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.4, 0, 0.2, 1] }}
      className="rounded-2xl border p-6"
      style={{ background: "var(--bg-card)", borderColor: "var(--border-default)" }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--color-primary-light)" }}
        >
          <span style={{ color: "var(--color-primary)" }}>{icon}</span>
        </div>
        <div>
          <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{title}</h3>
          {subtitle && <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{subtitle}</p>}
        </div>
      </div>
      {children}
    </motion.div>
  );
}

function ChipSelect({
  options,
  value,
  onChange,
  error,
}: {
  options: readonly { value: string; label: string; color?: string; bg?: string; emoji?: string }[];
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border"
              style={{
                background: active ? (opt.color ? opt.bg : "var(--color-primary-light)") : "var(--bg-tertiary)",
                borderColor: active ? (opt.color || "var(--color-primary)") : "var(--border-default)",
                color: active ? (opt.color || "var(--color-primary)") : "var(--text-secondary)",
                boxShadow: active ? `0 0 0 1px ${opt.color || "var(--color-primary)"}20` : "none",
              }}
            >
              {opt.emoji && <span className="mr-1">{opt.emoji}</span>}
              {opt.label}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-1.5 text-xs font-medium" style={{ color: "var(--color-danger)" }}>{error}</p>}
    </div>
  );
}

function UnsavedDialog({
  open,
  onDiscard,
  onStay,
}: {
  open: boolean;
  onDiscard: () => void;
  onStay: () => void;
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 modal-backdrop" onClick={onStay} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="relative rounded-2xl shadow-xl max-w-sm w-full p-6 border"
        style={{ background: "var(--bg-card)", borderColor: "var(--border-default)" }}
      >
        <div className="flex flex-col items-center text-center mb-5">
          <div
            className="h-12 w-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "var(--color-warning-light)" }}
          >
            <span className="text-xl">⚠️</span>
          </div>
          <h3 className="text-base font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            Discard Changes?
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            You have unsaved changes. Are you sure you want to leave?
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onStay}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all btn-active"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
          >
            Stay
          </button>
          <button
            onClick={onDiscard}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all btn-active"
            style={{ background: "var(--color-danger)" }}
          >
            Discard
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function CompleteConfirmDialog({
  open,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 modal-backdrop" onClick={loading ? undefined : onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="relative rounded-2xl shadow-xl max-w-sm w-full p-6 border"
        style={{ background: "var(--bg-card)", borderColor: "var(--border-default)" }}
      >
        <div className="flex flex-col items-center text-center mb-5">
          <div
            className="h-12 w-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "var(--color-success-light)" }}
          >
            <CheckCircle2 className="h-6 w-6" style={{ color: "var(--color-success)" }} />
          </div>
          <h3 className="text-base font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            Are you sure?
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Are you sure you completed this reminder?
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all btn-active"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all btn-active flex items-center justify-center gap-2"
            style={{ background: "var(--color-success)", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Completing...
              </>
            ) : (
              "Yes, Complete"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ──────────────────────────── main component ──────────────────────────── */

interface PremiumReminderFormProps {
  reminderId?: string;
}

export default function PremiumReminderForm({ reminderId }: PremiumReminderFormProps) {
  const isEdit = !!reminderId;
  const router = useRouter();
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateMode, setDateMode] = useState<"preset" | "custom">("preset");
  const [timeMode, setTimeMode] = useState<"preset" | "custom">("preset");
  const { user } = useAuth();
  const [notificationMethods, setNotificationMethods] = useState<string[]>([]);
  
  useEffect(() => {
    if (!isEdit && user) {
      if (user.preferredReminderMethod === "WhatsApp") setNotificationMethods(["whatsapp"]);
      else if (user.preferredReminderMethod === "Both") setNotificationMethods(["email", "whatsapp"]);
      else setNotificationMethods(["email"]);
    }
  }, [isEdit, user]);
  const [completed, setCompleted] = useState(false);
  const [showUnsaved, setShowUnsaved] = useState(false);
  const [pendingNav, setPendingNav] = useState<(() => void) | null>(null);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);

  const todayStr = useMemo(() => getTodayStr(), []);
  const schema = useMemo(() => buildSchema(isEdit), [isEdit]);

    const { control, register, handleSubmit, setValue, watch, reset, getValues, formState: { errors } } = useForm<ReminderFormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        priority: "Medium",
        category: "Assignment",
        dueDate: todayStr,
        dueTime: "17:00",
        completed: false,
        reminderSchedule: [{ date: todayStr, time: getCurrentTimeStr() }],
      },
    });

    const { fields: scheduleFields, append: appendSchedule, remove: removeSchedule, replace: replaceSchedules } = useFieldArray({
      control,
      name: "reminderSchedule"
    });

    const [reminderCount, setReminderCount] = useState("1");

    useEffect(() => {
      const currentCount = scheduleFields.length;
      const targetCount = parseInt(reminderCount, 10);
      if (targetCount > currentCount) {
        for (let i = 0; i < targetCount - currentCount; i++) {
          appendSchedule({ date: todayStr, time: getCurrentTimeStr() });
        }
      } else if (targetCount < currentCount) {
        for (let i = currentCount - 1; i >= targetCount; i--) {
          removeSchedule(i);
        }
      }
    }, [reminderCount, appendSchedule, removeSchedule, scheduleFields.length, todayStr]);

  // Build a snapshot of the current state for dirty comparison
  const buildSnapshot = useCallback(() => {
    const vals = getValues();
    return JSON.stringify({
      title: vals.title,
      subject: vals.subject,
      description: vals.description,
      priority: vals.priority,
      category: vals.category,
      dueDate: vals.dueDate,
      dueTime: vals.dueTime,
      completed,
      notificationMethods,
      reminderSchedule: vals.reminderSchedule,
    });
  }, [getValues, completed, notificationMethods]);

  const isDirty = initialSnapshot !== null && buildSnapshot() !== initialSnapshot;

  // Load reminder in edit mode
  useEffect(() => {
    if (!reminderId) return;

    let cancelled = false;
    async function fetchReminder() {
      try {
        setLoading(true);
        const { data } = await remindersAPI.getById(reminderId!);
        if (!cancelled) {
          if (data.success) {
            const r = data.reminder;
            setCompleted(r.completed);
            setNotificationMethods(r.notificationMethods || ["email"]);
            reset({
              title: r.title,
              description: r.description,
              subject: r.subject,
              category: r.category,
              priority: r.priority,
              dueDate: new Date(r.dueDate).toISOString().split("T")[0],
              dueTime: r.dueTime || "23:59",
              completed: r.completed,
              reminderSchedule: r.reminderSchedule && r.reminderSchedule.length > 0 
                ? r.reminderSchedule.map(s => ({ date: s.date, time: s.time }))
                : [{ date: new Date(r.dueDate).toISOString().split("T")[0], time: getCurrentTimeStr() }],
            });
            setReminderCount(String(r.reminderSchedule?.length || 1));
          } else {
            setError("Reminder not found");
          }
        }
      } catch {
        if (!cancelled) setError("Failed to load reminder");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchReminder();
    return () => { cancelled = true; };
  }, [reminderId, reset]);

  // Capture snapshot after form is populated in edit or create mode
  useEffect(() => {
    if (initialSnapshot === null) {
      if (isEdit) {
        if (!loading) {
          const timer = setTimeout(() => setInitialSnapshot(buildSnapshot()), 0);
          return () => clearTimeout(timer);
        }
      } else {
        const timer = setTimeout(() => setInitialSnapshot(buildSnapshot()), 0);
        return () => clearTimeout(timer);
      }
    }
  }, [isEdit, loading, initialSnapshot, buildSnapshot]);

  // Unsaved changes guard
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const navigateAway = useCallback((fn: () => void) => {
    if (isDirty) {
      setPendingNav(() => fn);
      setShowUnsaved(true);
    } else {
      fn();
    }
  }, [isDirty]);

  const watchedTitle = watch("title");
  const watchedSubject = watch("subject");
  const watchedDescription = watch("description");
  const watchedPriority = watch("priority");
  const watchedCategory = watch("category");
  const watchedDueDate = watch("dueDate");
  const watchedDueTime = watch("dueTime");
  const watchedReminderSchedule = watch("reminderSchedule");

  const handleDatePreset = useCallback((offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setValue("dueDate", str, { shouldValidate: true, shouldDirty: true });
  }, [setValue]);

  const handleTimePreset = useCallback((time: string) => {
    setValue("dueTime", time, { shouldValidate: true, shouldDirty: true });
  }, [setValue]);

  const toggleNotificationMethod = useCallback((method: string) => {
    setNotificationMethods((prev) => 
      prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]
    );
  }, []);

  const onSubmit = async (data: ReminderFormData) => {
    try {
      setSubmitting(true);
      if (isEdit) {
        await remindersAPI.update(reminderId!, {
          title: data.title,
          description: data.description || "",
          subject: data.subject,
          category: (data.category as Category) || undefined,
          priority: (data.priority as Priority) || undefined,
          dueDate: data.dueDate,
          dueTime: data.dueTime,
          completed: data.completed,
          notificationMethods: notificationMethods as any,
          reminderSchedule: data.reminderSchedule,
        });
        toast.success("Reminder updated successfully!");
      } else {
        await remindersAPI.create({
          title: data.title,
          description: data.description || "",
          subject: data.subject,
          category: (data.category as Category) || "Other",
          priority: (data.priority as Priority) || "Medium",
          dueDate: data.dueDate,
          dueTime: data.dueTime,
          notificationMethods: notificationMethods as any,
          reminderSchedule: data.reminderSchedule,
        });
        toast.success("Reminder created successfully!", { duration: 4000 });
      }
      router.push("/dashboard/reminders");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || err.message
          : isEdit ? "Failed to update reminder" : "Failed to create reminder";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!reminderId) return;
    try {
      setCompleting(true);
      await remindersAPI.update(reminderId, { completed: true });
      setCompleted(true);
      setShowCompleteConfirm(false);
      toast.success("✓ Reminder completed!");
    } catch {
      toast.error("Failed to mark as completed");
    } finally {
      setCompleting(false);
    }
  };

  const priorityMeta = PRIORITY_OPTIONS.find((p) => p.value === watchedPriority) || PRIORITY_OPTIONS[1];
  const categoryMeta = CATEGORY_OPTIONS.find((c) => c.value === watchedCategory) || CATEGORY_OPTIONS[7];

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg-secondary)" }}>
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-2xl border p-8" style={{ background: "var(--bg-card)", borderColor: "var(--border-default)" }}>
            <div className="flex items-center justify-center py-16">
              <Loader size="md" text="Loading reminder..." />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg-secondary)" }}>
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-2xl border" style={{ background: "var(--bg-card)", borderColor: "var(--border-default)" }}>
            <ErrorState message={error} onRetry={() => router.refresh()} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-secondary)" }}>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <button
            type="button"
            onClick={() => navigateAway(() => router.push("/dashboard/reminders"))}
            className="inline-flex items-center gap-1.5 text-xs font-medium mb-4 transition-colors hover:opacity-80"
            style={{ color: "var(--text-tertiary)" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Reminders
          </button>
          <div className="flex items-start gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: "var(--color-primary-light)" }}
            >
              <Calendar className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
                {isEdit ? "Edit Reminder" : "Create Reminder"}
              </h1>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                {isEdit ? "Update your reminder details." : "Create a reminder you'll never miss. Estimated time: less than 20 seconds."}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Two-column layout */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col lg:flex-row gap-6">
          {/* Left — Form */}
          <div className="flex-1 space-y-5 min-w-0">
            {/* Card 1: Details */}
            <FormCard icon={<FileText className="h-4 w-4" />} title="Reminder Details" subtitle="What do you need to remember?" delay={0.05}>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>📝 Title *</label>
                  <input
                    {...register("title")}
                    placeholder="e.g., Submit Math Assignment"
                    className="w-full rounded-xl border px-4 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0"
                    style={{
                      borderColor: errors.title ? "var(--color-danger)" : "var(--border-default)",
                      background: "var(--bg-tertiary)",
                      color: "var(--text-primary)",
                      boxShadow: errors.title ? "0 0 0 2px rgba(239,68,68,0.12)" : "none",
                    }}
                  />
                  {errors.title && <p className="mt-1 text-xs font-medium" style={{ color: "var(--color-danger)" }}>{errors.title.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>📚 Subject *</label>
                  <input
                    {...register("subject")}
                    placeholder="e.g., Mathematics, Physics"
                    className="w-full rounded-xl border px-4 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0"
                    style={{
                      borderColor: errors.subject ? "var(--color-danger)" : "var(--border-default)",
                      background: "var(--bg-tertiary)",
                      color: "var(--text-primary)",
                    }}
                  />
                  {errors.subject && <p className="mt-1 text-xs font-medium" style={{ color: "var(--color-danger)" }}>{errors.subject.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>📝 Description</label>
                  <textarea
                    {...register("description")}
                    rows={3}
                    placeholder="Add details (optional)"
                    className="w-full rounded-xl border px-4 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 resize-none"
                    style={{ borderColor: "var(--border-default)", background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                  />
                </div>
              </div>
            </FormCard>

            {/* Card 2: Deadline */}
            <FormCard icon={<Clock className="h-4 w-4" />} title="Task Deadline" subtitle="When is this due?" delay={0.1}>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>📅 Due Date *</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {DATE_PRESETS.map((preset) => {
                      const presetDate = addDays(todayStr, preset.offset);
                      const active = watchedDueDate === presetDate && dateMode === "preset";
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => { setDateMode("preset"); handleDatePreset(preset.offset); }}
                          className="px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border"
                          style={{
                            background: active ? "var(--color-primary-light)" : "var(--bg-tertiary)",
                            borderColor: active ? "var(--color-primary)" : "var(--border-default)",
                            color: active ? "var(--color-primary)" : "var(--text-secondary)",
                          }}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setDateMode("custom")}
                      className="px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border"
                      style={{
                        background: dateMode === "custom" ? "var(--color-primary-light)" : "var(--bg-tertiary)",
                        borderColor: dateMode === "custom" ? "var(--color-primary)" : "var(--border-default)",
                        color: dateMode === "custom" ? "var(--color-primary)" : "var(--text-secondary)",
                      }}
                    >
                      Custom
                    </button>
                  </div>
                  <AnimatePresence>
                    {dateMode === "custom" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                        <input
                          type="date"
                          {...register("dueDate")}
                          min={todayStr}
                          className="w-full rounded-xl border px-4 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0"
                          style={{ borderColor: "var(--border-default)", background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {errors.dueDate && <p className="mt-1.5 text-xs font-medium" style={{ color: "var(--color-danger)" }}>{errors.dueDate.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>⏰ Time *</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {TIME_PRESETS.map((preset) => {
                      const active = watchedDueTime === preset.time && timeMode === "preset";
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => { setTimeMode("preset"); handleTimePreset(preset.time); }}
                          className="px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border"
                          style={{
                            background: active ? "var(--color-primary-light)" : "var(--bg-tertiary)",
                            borderColor: active ? "var(--color-primary)" : "var(--border-default)",
                            color: active ? "var(--color-primary)" : "var(--text-secondary)",
                          }}
                        >
                          {preset.emoji} {preset.label}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setTimeMode("custom")}
                      className="px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border"
                      style={{
                        background: timeMode === "custom" ? "var(--color-primary-light)" : "var(--bg-tertiary)",
                        borderColor: timeMode === "custom" ? "var(--color-primary)" : "var(--border-default)",
                        color: timeMode === "custom" ? "var(--color-primary)" : "var(--text-secondary)",
                      }}
                    >
                      Custom
                    </button>
                  </div>
                  <AnimatePresence>
                    {timeMode === "custom" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                        <input
                          type="time"
                          {...register("dueTime")}
                          className="w-full rounded-xl border px-4 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0"
                          style={{ borderColor: "var(--border-default)", background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {errors.dueTime && <p className="mt-1.5 text-xs font-medium" style={{ color: "var(--color-danger)" }}>{errors.dueTime.message}</p>}
                  <p className="text-[11px] mt-1.5" style={{ color: "var(--text-tertiary)" }}>
                    🌍 Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                  </p>
                </div>
              </div>
            </FormCard>

            {/* Card 3: Reminder Schedule */}
            <FormCard icon={<Bell className="h-4 w-4" />} title="Reminder Notifications" subtitle="When do you want to be reminded?" delay={0.12}>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Number of Reminder Notifications</label>
                  <select
                    value={reminderCount}
                    onChange={(e) => setReminderCount(e.target.value)}
                    className="w-full rounded-xl border px-4 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 bg-transparent"
                    style={{ borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                  >
                    {[1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  {scheduleFields.map((field, index) => (
                    <div key={field.id} className="p-4 rounded-xl border" style={{ borderColor: "var(--border-default)", background: "var(--bg-tertiary)" }}>
                      <p className="text-xs font-bold mb-3" style={{ color: "var(--text-primary)" }}>Reminder {index + 1}</p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Date *</label>
                          <input
                            type="date"
                            {...register(`reminderSchedule.${index}.date` as const)}
                            min={todayStr}
                            className="w-full rounded-lg border px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2"
                            style={{ borderColor: errors.reminderSchedule?.[index]?.date ? "var(--color-danger)" : "var(--border-default)", background: "var(--bg-card)", color: "var(--text-primary)" }}
                          />
                          {errors.reminderSchedule?.[index]?.date && <p className="mt-1 text-[10px] font-medium text-red-500">{errors.reminderSchedule[index].date.message}</p>}
                        </div>
                        <div className="flex-1">
                          <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Time *</label>
                          <input
                            type="time"
                            {...register(`reminderSchedule.${index}.time` as const)}
                            className="w-full rounded-lg border px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2"
                            style={{ borderColor: errors.reminderSchedule?.[index]?.time ? "var(--color-danger)" : "var(--border-default)", background: "var(--bg-card)", color: "var(--text-primary)" }}
                          />
                          {errors.reminderSchedule?.[index]?.time && <p className="mt-1 text-[10px] font-medium text-red-500">{errors.reminderSchedule[index].time.message}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {errors.reminderSchedule?.message && <p className="mt-1 text-xs font-medium text-red-500">{errors.reminderSchedule.message}</p>}
                </div>
              </div>
            </FormCard>

            {/* Card 4: Priority & Category */}
            <FormCard icon={<Flag className="h-4 w-4" />} title="Priority & Category" subtitle="How important is this?" delay={0.15}>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>🚦 Priority</label>
                  <ChipSelect
                    options={PRIORITY_OPTIONS}
                    value={watchedPriority}
                    onChange={(v) => setValue("priority", v, { shouldValidate: true, shouldDirty: true })}
                    error={errors.priority?.message}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>🏷️ Category</label>
                  <ChipSelect
                    options={CATEGORY_OPTIONS}
                    value={watchedCategory}
                    onChange={(v) => setValue("category", v, { shouldValidate: true, shouldDirty: true })}
                    error={errors.category?.message}
                  />
                </div>
              </div>
            </FormCard>

            {/* Card 5: Notifications */}
            <FormCard icon={<Bell className="h-4 w-4" />} title="Notification Methods" subtitle="How should we remind you?" delay={0.2}>
              <div className="space-y-2">
                {NOTIFICATION_METHOD_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
                    style={{ background: notificationMethods.includes(opt.value) ? "var(--color-primary-light)" : "transparent" }}
                  >
                    <input
                      type="checkbox"
                      checked={notificationMethods.includes(opt.value)}
                      onChange={() => toggleNotificationMethod(opt.value)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{opt.label}</span>
                  </label>
                ))}
              </div>
            </FormCard>

            {/* Edit-only: Mark Completed */}
            {isEdit && (
              <FormCard icon={<CheckCircle2 className="h-4 w-4" />} title="Reminder Status" subtitle="Mark completion status" delay={0.22}>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (!completed) {
                        setShowCompleteConfirm(true);
                      } else {
                        setCompleted(false);
                        setValue("completed", false, { shouldDirty: true });
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 border"
                    style={{
                      background: completed ? "var(--color-success-light)" : "var(--bg-tertiary)",
                      borderColor: completed ? "var(--color-success)" : "var(--border-default)",
                    }}
                  >
                    {completed ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
                        <CheckCircle2 className="h-5 w-5" style={{ color: "var(--color-success)" }} />
                      </motion.div>
                    ) : (
                      <Circle className="h-5 w-5" style={{ color: "var(--text-tertiary)" }} />
                    )}
                    <span className="text-sm font-semibold" style={{ color: completed ? "var(--color-success)" : "var(--text-primary)" }}>
                      {completed ? "✓ Completed" : "Pending"}
                    </span>
                  </button>
                </div>
              </FormCard>
            )}

            {/* Action bar */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
              className="flex items-center gap-3 pb-6"
            >
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigateAway(() => router.push("/dashboard/reminders"))}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={submitting}
                disabled={isEdit && !isDirty}
                className="flex items-center gap-2"
              >
                {isEdit ? <Save className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                {isEdit ? "Save Changes" : "Create Reminder"}
              </Button>
            </motion.div>
          </div>

          {/* Right — Live Preview */}
          <div className="w-full lg:w-[320px] flex-shrink-0">
            <div className="lg:sticky lg:top-6">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className="rounded-2xl border overflow-hidden"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-default)" }}
              >
                <div className="px-5 py-3.5 border-b" style={{ borderColor: "var(--border-default)", background: "var(--bg-tertiary)" }}>
                  <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                    Reminder Preview
                  </p>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-base font-bold leading-snug" style={{ color: watchedTitle ? "var(--text-primary)" : "var(--text-tertiary)" }}>
                      {watchedTitle || "Your reminder title"}
                    </p>
                    {watchedSubject && (
                      <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{watchedSubject}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: priorityMeta.bg, color: priorityMeta.color }}>
                      {watchedPriority?.toUpperCase() || "MEDIUM"} PRIORITY
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                      {categoryMeta.emoji} {watchedCategory || "Assignment"}
                    </span>
                    {isEdit && completed && (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "var(--color-success-light)", color: "var(--color-success)" }}>
                        ✓ COMPLETED
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" style={{ color: "var(--text-tertiary)" }} />
                      <span className="text-xs font-medium" style={{ color: watchedDueDate ? "var(--text-primary)" : "var(--text-tertiary)" }}>
                        {watchedDueDate ? formatDateDisplay(watchedDueDate) : "Select a date"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" style={{ color: "var(--text-tertiary)" }} />
                      <span className="text-xs font-medium" style={{ color: watchedDueTime ? "var(--text-primary)" : "var(--text-tertiary)" }}>
                        {watchedDueTime ? formatTimeDisplay(watchedDueTime) : "Select a time"}
                      </span>
                    </div>
                    {watchedDueDate && watchedDueTime && (
                      <p className="text-[11px] font-semibold" style={{ color: "var(--color-primary)" }}>
                        ⏱️ {getCountdown(watchedDueDate, watchedDueTime)}
                      </p>
                    )}
                  </div>
                  {watchedDescription && (
                    <div className="pt-2 border-t" style={{ borderColor: "var(--border-light)" }}>
                      <p className="text-[11px] font-semibold mb-1" style={{ color: "var(--text-tertiary)" }}>Description</p>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{watchedDescription}</p>
                    </div>
                  )}
                  <div className="pt-2 border-t" style={{ borderColor: "var(--border-light)" }}>
                    <p className="text-[11px] font-semibold mb-2" style={{ color: "var(--text-tertiary)" }}>Upcoming Reminder Schedule</p>
                    <div className="space-y-1">
                      {watchedReminderSchedule && watchedReminderSchedule.length > 0 ? (
                        watchedReminderSchedule.map((sch, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Bell className="h-3 w-3" style={{ color: "var(--color-primary)" }} />
                            <span className="text-[11px] font-medium" style={{ color: "var(--text-primary)" }}>
                              {sch.date ? formatDateDisplay(sch.date) : "Select date"} — {sch.time ? formatTimeDisplay(sch.time) : "Select time"}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>No reminders scheduled</span>
                      )}
                    </div>
                  </div>
                  <div className="pt-2 border-t" style={{ borderColor: "var(--border-light)" }}>
                    <p className="text-[11px] font-semibold mb-2" style={{ color: "var(--text-tertiary)" }}>Notification Methods</p>
                    <div className="space-y-1">
                      {NOTIFICATION_METHOD_OPTIONS.map((opt) => (
                        <div key={opt.value} className="flex items-center gap-2">
                          <CheckCircle2
                            className="h-3 w-3"
                            style={{ color: notificationMethods.includes(opt.value) ? "var(--color-success)" : "var(--text-tertiary)" }}
                          />
                          <span
                            className="text-[11px]"
                            style={{
                              color: notificationMethods.includes(opt.value) ? "var(--text-primary)" : "var(--text-tertiary)",
                              textDecoration: notificationMethods.includes(opt.value) ? "none" : "line-through",
                            }}
                          >
                            {opt.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pt-3 border-t" style={{ borderColor: "var(--border-light)" }}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ background: watchedTitle && watchedSubject && watchedDueDate && watchedDueTime ? "var(--color-success)" : "var(--color-warning)" }}
                      />
                      <p className="text-[11px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                        {watchedTitle && watchedSubject && watchedDueDate && watchedDueTime
                          ? (isEdit ? "Ready to Save" : "Ready to Save")
                          : "Fill in required fields"}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </form>
      </main>

      {/* Dialogs */}
      <UnsavedDialog
        open={showUnsaved}
        onDiscard={() => { setShowUnsaved(false); pendingNav?.(); setPendingNav(null); }}
        onStay={() => { setShowUnsaved(false); setPendingNav(null); }}
      />
      <CompleteConfirmDialog
        open={showCompleteConfirm}
        onConfirm={handleComplete}
        onCancel={() => setShowCompleteConfirm(false)}
        loading={completing}
      />
    </div>
  );
}
