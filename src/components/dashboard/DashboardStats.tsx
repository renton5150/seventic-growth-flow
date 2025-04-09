
import { StatCard } from "@/components/dashboard/StatCard";
import { Mail, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Request } from "@/types/types";
import { StatFilter } from "@/components/admin/AdminStatsSummary";

interface DashboardStatsProps {
  requests: Request[];
  onFilterChange?: (filter: StatFilter) => void;
  currentFilter: StatFilter;
}

export const DashboardStats = ({ requests, onFilterChange, currentFilter }: DashboardStatsProps) => {
  const totalRequests = requests.length;
  const pendingRequests = requests.filter((r) => r.status === "pending").length;
  const completedRequests = requests.filter((r) => r.status === "completed").length;
  const lateRequests = requests.filter((r) => r.isLate).length;

  const handleFilterChange = (filter: StatFilter) => {
    if (onFilterChange) {
      onFilterChange(filter);
    }
  };

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total des demandes"
        value={totalRequests}
        icon={<Mail size={24} className="text-seventic-500" />}
        className={currentFilter === "all" ? "border-seventic-500 bg-seventic-50" : ""}
        onClick={() => handleFilterChange("all")}
      />
      <StatCard
        title="En attente"
        value={pendingRequests}
        icon={<Clock size={24} className="text-status-pending" />}
        className={currentFilter === "pending" ? "border-amber-500 bg-amber-50" : ""}
        onClick={() => handleFilterChange("pending")}
      />
      <StatCard
        title="Terminées"
        value={completedRequests}
        icon={<CheckCircle size={24} className="text-status-completed" />}
        className={currentFilter === "completed" ? "border-green-500 bg-green-50" : ""}
        onClick={() => handleFilterChange("completed")}
      />
      <StatCard
        title="En retard"
        value={lateRequests}
        icon={<AlertCircle size={24} className="text-status-late" />}
        className={currentFilter === "late" ? "border-red-500 bg-red-50" : ""}
        onClick={() => handleFilterChange("late")}
      />
    </div>
  );
};
