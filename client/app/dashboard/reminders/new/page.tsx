"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Calendar } from "lucide-react";
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
  })
  .refine(
    (data) => {
      if (!data.dueDate) return true;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(data.dueDate) >= today;
    },
    {
      message: "Due date cannot be in the past",
      path: ["dueDate"],
    }
  );

type ReminderFormData = z.infer<typeof reminderSchema>;

function CreateReminderContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      priority: "Medium",
      category: "Other",
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
      });
      toast.success("Reminder created successfully!");
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link
          href="/dashboard/reminders"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Reminders
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={3}
                placeholder="Add a description (optional)"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none"
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

            <Input
              label="Due Date *"
              type="date"
              icon={<Calendar className="h-4 w-4" />}
              error={errors.dueDate?.message}
              {...register("dueDate")}
            />

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
