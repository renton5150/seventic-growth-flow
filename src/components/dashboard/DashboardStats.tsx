
import { StatCard } from "@/components/dashboard/StatCard";
import { Mail, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Request } from "@/types/types";

interface DashboardStatsProps {
  requests: Request[];
}

export const DashboardStats = ({ requests }: DashboardStatsProps) => {
  const totalRequests = requests.length;
  const pendingRequests = requests.filter((r) => r.status === "pending").length;
  const completedRequests = requests.filter((r) => r.status === "completed").length;
  const lateRequests = requests.filter((r) => r.isLate).length;

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total des demandes"
        value={totalRequests}
        icon={<Mail size={24} className="text-seventic-500" />}
      />
      <StatCard
        title="En attente"
        value={pendingRequests}
        icon={<Clock size={24} className="text-status-pending" />}
      />
      <StatCard
        title="Terminées"
        value={completedRequests}
        icon={<CheckCircle size={24} className="text-status-completed" />}
      />
      <StatCard
        title="En retard"
        value={lateRequests}
        icon={<AlertCircle size={24} className="text-status-late" />}
      />
    </div>
  );
};
