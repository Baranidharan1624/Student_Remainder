"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { CATEGORIES, PRIORITIES, type Category, type Priority } from "@/types";

const reminderSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(100, "Title is too long"),
    description: z.string().optional(),
    subject: z.string().min(1, "Subject is required"),
    category: z.string().min(1, "Category is required"),
    priority: z.string().optional(),
    dueDate: z.string().min(1, "Due date is required"),
    dueTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Valid time is required"),
    reminderSchedules: z.array(
      z.object({
        date: z.string().min(1, "Required"),
        time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Required"),
      })
    ).optional(),
  })
  .refine(
    (data) => {
      if (!data.dueDate || !data.dueTime) return true;
      const today = new Date();
      const selectedDate = new Date(`${data.dueDate}T${data.dueTime}:00`);
      return selectedDate >= today;
    },
    {
      message: "Reminder cannot be set in the past",
      path: ["dueTime"],
    }
  );

type ReminderFormData = z.infer<typeof reminderSchema>;

function CreateReminderContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reminderCount, setReminderCount] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      priority: "Medium",
      category: "Other",
      reminderSchedules: [{ date: "", time: "" }],
    },
  });

  const onSubmit = async (data: ReminderFormData) => {
    try {
      setLoading(true);
      await remindersAPI.create({
        title: data.title,
        description: data.description || "",
        subject: data.subject,
        category: (data.category as Category) || "Other",
        priority: (data.priority as Priority) || "Medium",
        dueDate: data.dueDate,
        dueTime: data.dueTime,
        reminderSchedules: data.reminderSchedules?.slice(0, reminderCount) || [],
      });
      toast.success("Reminder created successfully.", { duration: 5000 });
      router.push("/dashboard/reminders");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || error.message
          : "Failed to create reminder";
      toast.error(message);
    } finally {
      setLoading(false);
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

        <div
          className="rounded-2xl border p-6 sm:p-8 animate-fade-in"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-default)",
          }}
        >
          <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
            Create New Reminder
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

            <div className="pt-4 border-t" style={{ borderColor: "var(--border-default)" }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                Reminder Schedule
              </h3>
              
              <div className="mb-4">
                <Select
                  label="Number of Reminder Emails"
                  options={Array.from({ length: 11 }).map((_, i) => ({ value: String(i), label: String(i) }))}
                  value={String(reminderCount)}
                  onChange={(e) => setReminderCount(Number(e.target.value))}
                />
              </div>

              {Array.from({ length: reminderCount }).map((_, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 p-4 rounded-xl border" style={{ borderColor: "var(--border-default)", background: "var(--bg-tertiary)" }}>
                  <Input
                    label={`Reminder ${index + 1} Date *`}
                    type="date"
                    icon={<Calendar className="h-4 w-4" />}
                    error={errors.reminderSchedules?.[index]?.date?.message}
                    {...register(`reminderSchedules.${index}.date` as const)}
                  />
                  <Input
                    label={`Reminder ${index + 1} Time *`}
                    type="time"
                    icon={<Clock className="h-4 w-4" />}
                    error={errors.reminderSchedules?.[index]?.time?.message}
                    {...register(`reminderSchedules.${index}.time` as const)}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button type="submit" loading={loading}>
                Create Reminder
              </Button>
              <Link href="/dashboard/reminders">
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function CreateReminderPage() {
  return (
    <ProtectedRoute>
      <CreateReminderContent />
    </ProtectedRoute>
  );
}
