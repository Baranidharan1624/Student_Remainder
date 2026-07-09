"use client";

import { useParams } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PremiumReminderForm from "@/components/reminder/PremiumReminderForm";

function EditReminderPage() {
  const params = useParams();
  const id = params.id as string;
  return <PremiumReminderForm reminderId={id} />;
}

export default function Page() {
  return (
    <ProtectedRoute>
      <EditReminderPage />
    </ProtectedRoute>
  );
}
