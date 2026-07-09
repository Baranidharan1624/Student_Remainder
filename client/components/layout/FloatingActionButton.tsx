"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function FloatingActionButton() {
  return (
    <div className="fixed bottom-8 right-8 z-50 group">
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Link
          href="/dashboard/reminders/new"
          className="relative h-14 w-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 block group overflow-hidden"
          style={{
            background: "linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary) 100%)",
            boxShadow: "0 4px 20px 0 rgba(37, 99, 235, 0.4)",
          }}
          aria-label="Add Reminder"
        >
          {/* Ripple Effect Background */}
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 group-active:opacity-20 transition-opacity rounded-full" />
          <Plus className="h-6 w-6 relative z-10" strokeWidth={2.5} />
        </Link>
      </motion.div>
      {/* Tooltip */}
      <div
        className="absolute bottom-full right-0 mb-3 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
        style={{
          background: "var(--bg-tooltip)",
          color: "var(--text-tooltip)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        Add Reminder
        <div
          className="absolute top-full right-5 w-0 h-0"
          style={{
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: "5px solid var(--bg-tooltip)",
          }}
        />
      </div>
    </div>
  );
}
