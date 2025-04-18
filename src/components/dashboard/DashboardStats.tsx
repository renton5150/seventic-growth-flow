
import { StatCard } from "@/components/dashboard/StatCard";
import { Mail, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Request } from "@/types/types";
import { useEffect } from "react";

interface DashboardStatsProps {
  requests: Request[];
  onStatClick: (filterType: "all" | "pending" | "completed" | "late") => void;
  activeTab: string;
}

export const DashboardStats = ({ requests, onStatClick, activeTab }: DashboardStatsProps) => {
  const totalRequests = requests.length;
  const pendingRequests = requests.filter((r) => r.status === "pending" || r.workflow_status === "pending_assignment").length;
  const completedRequests = requests.filter((r) => r.workflow_status === "completed").length;
  const lateRequests = requests.filter((r) => r.isLate).length;

  useEffect(() => {
    console.log("[DEBUG] DashboardStats - Current state:", {
      activeTab,
      total: totalRequests,
      pending: pendingRequests,
      completed: completedRequests,
      late: lateRequests
    });
  }, [activeTab, totalRequests, pendingRequests, completedRequests, lateRequests]);

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total des demandes"
        value={totalRequests}
        icon={<Mail size={24} className="text-seventic-500" />}
        onClick={() => onStatClick("all")}
        className={`cursor-pointer transition-all hover:shadow-md ${
          activeTab === "all" ? "border-2 border-primary bg-accent/50" : "hover:bg-accent/10"
        }`}
      />
      <StatCard
        title="En attente"
        value={pendingRequests}
        icon={<Clock size={24} className="text-status-pending" />}
        onClick={() => onStatClick("pending")}
        className={`cursor-pointer transition-all hover:shadow-md ${
          activeTab === "pending" ? "border-2 border-primary bg-accent/50" : "hover:bg-accent/10"
        }`}
      />
      <StatCard
        title="Terminées"
        value={completedRequests}
        icon={<CheckCircle size={24} className="text-status-completed" />}
        onClick={() => onStatClick("completed")}
        className={`cursor-pointer transition-all hover:shadow-md ${
          activeTab === "completed" ? "border-2 border-primary bg-accent/50" : "hover:bg-accent/10"
        }`}
      />
      <StatCard
        title="En retard"
        value={lateRequests}
        icon={<AlertCircle size={24} className="text-status-late" />}
        onClick={() => onStatClick("late")}
        className={`cursor-pointer transition-all hover:shadow-md ${
          activeTab === "late" ? "border-2 border-primary bg-accent/50" : "hover:bg-accent/10"
        }`}
      />
    </div>
  );
};
