
import { Mail, Clock, CheckCircle, AlertCircle, Activity } from "lucide-react";
import { Request } from "@/types/types";
import { StatCard } from "@/components/dashboard/StatCard";

interface GrowthStatsCardsProps {
  allRequests: Request[];
  onStatClick: (filterType: "all" | "pending" | "completed" | "late" | "inprogress") => void;
  activeFilter: string | null;
}

export const GrowthStatsCards = ({ allRequests, onStatClick, activeFilter }: GrowthStatsCardsProps) => {
  const pendingRequests = allRequests.filter(req => req.workflow_status === "pending_assignment");
  const inProgressRequests = allRequests.filter(req => req.workflow_status === "in_progress");
  const completedRequests = allRequests.filter(req => req.workflow_status === "completed");
  const lateRequests = allRequests.filter(req => req.isLate);
  const totalRequests = allRequests.length;

  console.log("[DEBUG] GrowthStatsCards - Active Filter:", activeFilter);
  console.log("[DEBUG] GrowthStatsCards - Request Counts:", {
    total: totalRequests,
    pending: pendingRequests.length,
    inProgress: inProgressRequests.length,
    completed: completedRequests.length,
    late: lateRequests.length
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <StatCard
        title="Total des demandes"
        value={totalRequests}
        icon={<Mail className="h-6 w-6 text-purple-600" />}
        onClick={() => onStatClick("all")}
        isActive={activeFilter === "all"}
        className="cursor-pointer hover:bg-gray-50 transition-colors"
      />
      <StatCard
        title="En attente"
        value={pendingRequests.length}
        icon={<Clock className="h-6 w-6 text-orange-600" />}
        onClick={() => onStatClick("pending")}
        isActive={activeFilter === "pending"}
        className="cursor-pointer hover:bg-gray-50 transition-colors"
      />
      <StatCard
        title="En cours"
        value={inProgressRequests.length}
        icon={<Activity className="h-6 w-6 text-blue-600" />}
        onClick={() => onStatClick("inprogress")}
        isActive={activeFilter === "inprogress"}
        className="cursor-pointer hover:bg-gray-50 transition-colors"
      />
      <StatCard
        title="Terminées"
        value={completedRequests.length}
        icon={<CheckCircle className="h-6 w-6 text-green-600" />}
        onClick={() => onStatClick("completed")}
        isActive={activeFilter === "completed"}
        className="cursor-pointer hover:bg-gray-50 transition-colors"
      />
      <StatCard
        title="En retard"
        value={lateRequests.length}
        icon={<AlertCircle className="h-6 w-6 text-red-600" />}
        onClick={() => onStatClick("late")}
        isActive={activeFilter === "late"}
        className="cursor-pointer hover:bg-gray-50 transition-colors"
      />
    </div>
  );
};
