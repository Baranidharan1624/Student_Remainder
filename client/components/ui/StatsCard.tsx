import { type LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  shadow: string;
}

export default function StatsCard({
  label,
  value,
  icon: Icon,
  color,
  shadow,
}: StatsCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 transition-all duration-200 hover:shadow-md ${shadow}`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`h-12 w-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

// Skeleton variant for loading state
export function StatsCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-gray-200" />
        <div className="space-y-2">
          <div className="h-3 w-20 bg-gray-200 rounded" />
          <div className="h-7 w-12 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}
