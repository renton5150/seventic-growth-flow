
import { StatCard } from "@/components/dashboard/StatCard";
import { Mail, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Request } from "@/types/types";

interface DashboardStatsProps {
  requests: Request[];
  onStatClick: (filterType: "all" | "pending" | "completed" | "late") => void;
  activeFilter: string | null;
}

export const DashboardStats = ({ requests, onStatClick, activeFilter }: DashboardStatsProps) => {
  const totalRequests = requests.length;
  const pendingRequests = requests.filter((r) => r.status === "pending" || r.workflow_status === "pending_assignment").length;
  const completedRequests = requests.filter((r) => r.workflow_status === "completed").length;
  const lateRequests = requests.filter((r) => r.isLate).length;

  console.log("[DEBUG] DashboardStats - Active filter:", activeFilter);

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total des demandes"
        value={totalRequests}
        icon={<Mail size={24} className="text-seventic-500" />}
        onClick={() => onStatClick("all")}
        isActive={activeFilter === "all"}
      />
      <StatCard
        title="En attente"
        value={pendingRequests}
        icon={<Clock size={24} className="text-status-pending" />}
        onClick={() => onStatClick("pending")}
        isActive={activeFilter === "pending"}
      />
      <StatCard
        title="Terminées"
        value={completedRequests}
        icon={<CheckCircle size={24} className="text-status-completed" />}
        onClick={() => onStatClick("completed")}
        isActive={activeFilter === "completed"}
      />
      <StatCard
        title="En retard"
        value={lateRequests}
        icon={<AlertCircle size={24} className="text-status-late" />}
        onClick={() => onStatClick("late")}
        isActive={activeFilter === "late"}
      />
    </div>
  );
};
