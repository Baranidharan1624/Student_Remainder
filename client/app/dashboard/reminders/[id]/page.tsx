"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { remindersAPI } from "@/lib/api";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Loader from "@/components/ui/Loader";
import ErrorState from "@/components/ui/ErrorState";
import { CATEGORIES, PRIORITIES, type Category, type Priority } from "@/types";

const reminderSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  category: z.string().min(1, "Category is required"),
  priority: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  dueTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Valid time is required"),
  completed: z.boolean().optional(),
})
.refine(
  (data) => {
    // During edit, we might be editing an old reminder that is already in the past.
    // It's often better not to strictly validate past dates on edit unless they change it, 
    // but the simplest approach is to allow it or only warn. We will remove the past date validation on edit.
    return true;
  },
  {
    message: "Reminder cannot be set in the past",
    path: ["dueTime"],
  }
);

type ReminderFormData = z.infer<typeof reminderSchema>;

function EditReminderContent() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
  });

  useEffect(() => {
    let cancelled = false;
    async function fetchReminder() {
      try {
        setLoading(true);
        const { data } = await remindersAPI.getById(id);
        if (!cancelled) {
          if (data.success) {
            const r = data.reminder;
            reset({
              title: r.title,
              description: r.description,
              subject: r.subject,
              category: r.category,
              priority: r.priority,
              dueDate: new Date(r.dueDate).toISOString().split("T")[0],
              dueTime: r.dueTime || "23:59", // fallback for older reminders
              completed: r.completed,
            });
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
  }, [id, reset]);

  const onSubmit = async (data: ReminderFormData) => {
    try {
      setSubmitting(true);
      await remindersAPI.update(id, {
        title: data.title,
        description: data.description || "",
        subject: data.subject,
        category: (data.category as Category) || undefined,
        priority: (data.priority as Priority) || undefined,
        dueDate: data.dueDate,
        dueTime: data.dueTime,
        completed: data.completed,
      });
      toast.success("Reminder updated successfully!");
      router.push("/dashboard/reminders");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message || err.message
          : "Failed to update reminder";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-secondary)" }}>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/dashboard/reminders"
          className="inline-flex items-center gap-2 text-sm mb-6 transition-colors hover:opacity-80"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Reminders
        </Link>

        {loading ? (
          <div
            className="rounded-2xl border p-8"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-default)" }}
          >
            <div className="flex items-center justify-center py-12">
              <Loader size="md" text="Loading reminder..." />
            </div>
          </div>
        ) : error ? (
          <div
            className="rounded-2xl border"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-default)" }}
          >
            <ErrorState message={error} onRetry={() => router.refresh()} />
          </div>
        ) : (
          <div
            className="rounded-2xl border p-6 sm:p-8 animate-fade-in"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-default)" }}
          >
            <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
              Edit Reminder
            </h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="Title *"
                placeholder="Enter reminder title"
                error={errors.title?.message}
                {...register("title")}
              />

              <Input
                label="Subject *"
                placeholder="e.g., Mathematics, Physics"
                error={errors.subject?.message}
                {...register("subject")}
              />

              <div className="w-full">
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Description
                </label>
                <textarea
                  {...register("description")}
                  rows={3}
                  placeholder="Add a description (optional)"
                  className="w-full rounded-2xl border px-4 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 resize-none"
                  style={{
                    borderColor: "var(--border-default)",
                    background: "var(--bg-tertiary)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Category *"
                  options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                  error={errors.category?.message}
                  {...register("category")}
                />

                <Select
                  label="Priority"
                  options={PRIORITIES.map((p) => ({ value: p, label: p }))}
                  error={errors.priority?.message}
                  {...register("priority")}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Due Date *"
                  type="date"
                  icon={<Calendar className="h-4 w-4" />}
                  error={errors.dueDate?.message}
                  {...register("dueDate")}
                />
                <Input
                  label="Time *"
                  type="time"
                  icon={<Clock className="h-4 w-4" />}
                  error={errors.dueTime?.message}
                  {...register("dueTime")}
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    {...register("completed")}
                  />
                  <div
                    className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                    style={{
                      background: "var(--bg-tertiary)",
                      borderColor: "var(--border-default)",
                    }}
                  />
                </label>
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  Mark as Completed
                </span>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button type="submit" loading={submitting}>
                  Save Changes
                </Button>
                <Link href="/dashboard/reminders">
                  <Button type="button" variant="ghost">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default function EditReminderPage() {
  return (
    <ProtectedRoute>
      <EditReminderContent />
    </ProtectedRoute>
  );
}
