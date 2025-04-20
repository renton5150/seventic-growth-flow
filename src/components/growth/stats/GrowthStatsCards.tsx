
import { Mail, Clock, CheckCircle, AlertCircle, ArrowRightLeft } from "lucide-react";
import { Request } from "@/types/types";
import { StatCard } from "@/components/dashboard/StatCard";

interface GrowthStatsCardsProps {
  allRequests: Request[];
  onStatClick: (filterType: "all" | "pending" | "completed" | "late" | "inprogress") => void;
  activeFilter?: string | null;
}

export const GrowthStatsCards = ({ allRequests, onStatClick, activeFilter }: GrowthStatsCardsProps) => {
  const pendingRequests = allRequests.filter(req => req.workflow_status === "pending_assignment");
  const inProgressRequests = allRequests.filter(req => req.workflow_status === "in_progress");
  const completedRequests = allRequests.filter(req => req.workflow_status === "completed");
  const lateRequests = allRequests.filter(req => req.isLate);
  const totalRequests = allRequests.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <StatCard
        title="Total des demandes"
        value={totalRequests}
        icon={<Mail className="h-6 w-6 text-purple-600" />}
        onClick={() => onStatClick("all")}
        isActive={activeFilter === "all"}
      />
      <StatCard
        title="En attente"
        value={pendingRequests.length}
        icon={<Clock className="h-6 w-6 text-orange-600" />}
        onClick={() => onStatClick("pending")}
        isActive={activeFilter === "pending"}
      />
      <StatCard
        title="En cours"
        value={inProgressRequests.length}
        icon={<ArrowRightLeft className="h-6 w-6 text-blue-600" />}
        onClick={() => onStatClick("inprogress")}
        isActive={activeFilter === "inprogress"}
      />
      <StatCard
        title="Terminées"
        value={completedRequests.length}
        icon={<CheckCircle className="h-6 w-6 text-green-600" />}
        onClick={() => onStatClick("completed")}
        isActive={activeFilter === "completed"}
      />
      <StatCard
        title="En retard"
        value={lateRequests.length}
        icon={<AlertCircle className="h-6 w-6 text-red-600" />}
        onClick={() => onStatClick("late")}
        isActive={activeFilter === "late"}
      />
    </div>
  );
};
