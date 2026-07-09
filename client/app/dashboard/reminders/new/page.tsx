"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PremiumReminderForm from "@/components/reminder/PremiumReminderForm";

function CreateReminderPage() {
  return <PremiumReminderForm />;
}

export default function Page() {
  return (
    <ProtectedRoute>
      <CreateReminderPage />
    </ProtectedRoute>
  );
}
