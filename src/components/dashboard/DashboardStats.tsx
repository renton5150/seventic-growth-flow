
import { StatCard } from "@/components/dashboard/StatCard";
import { Mail, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Request } from "@/types/types";

interface DashboardStatsProps {
  requests: Request[];
  onStatClick: (filterType: "all" | "pending" | "completed" | "late") => void;
}

export const DashboardStats = ({ requests, onStatClick }: DashboardStatsProps) => {
  const totalRequests = requests.length;
  const pendingRequests = requests.filter((r) => r.status === "pending" || r.workflow_status === "pending_assignment").length;
  const completedRequests = requests.filter((r) => r.workflow_status === "completed").length;
  const lateRequests = requests.filter((r) => r.isLate).length;

  // Implémentation robuste avec logging
  const handleStatClick = (filterType: "all" | "pending" | "completed" | "late") => {
    console.log("DashboardStats - StatCard clicked:", filterType);
    
    // Appel direct à la fonction parent
    onStatClick(filterType);
  };

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total des demandes"
        value={totalRequests}
        icon={<Mail size={24} className="text-seventic-500" />}
        onClick={() => handleStatClick("all")}
        className="cursor-pointer hover:bg-gray-50 transition-colors"
      />
      <StatCard
        title="En attente"
        value={pendingRequests}
        icon={<Clock size={24} className="text-status-pending" />}
        onClick={() => handleStatClick("pending")}
        className="cursor-pointer hover:bg-gray-50 transition-colors"
      />
      <StatCard
        title="Terminées"
        value={completedRequests}
        icon={<CheckCircle size={24} className="text-status-completed" />}
        onClick={() => handleStatClick("completed")}
        className="cursor-pointer hover:bg-gray-50 transition-colors"
      />
      <StatCard
        title="En retard"
        value={lateRequests}
        icon={<AlertCircle size={24} className="text-status-late" />}
        onClick={() => handleStatClick("late")}
        className="cursor-pointer hover:bg-gray-50 transition-colors"
      />
    </div>
  );
};
