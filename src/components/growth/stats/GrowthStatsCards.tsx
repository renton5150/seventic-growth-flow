
import { Mail, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Request } from "@/types/types";
import { StatCard } from "@/components/dashboard/StatCard";

interface GrowthStatsCardsProps {
  allRequests: Request[];
  onStatClick: (filterType: "all" | "pending" | "completed" | "late") => void;
}

export const GrowthStatsCards = ({ allRequests, onStatClick }: GrowthStatsCardsProps) => {
  const pendingRequests = allRequests.filter(req => req.workflow_status === "pending_assignment");
  const completedRequests = allRequests.filter(req => req.workflow_status === "completed");
  const lateRequests = allRequests.filter(req => req.isLate);
  const totalRequests = allRequests.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        title="Total des demandes"
        value={totalRequests}
        icon={<Mail className="h-6 w-6 text-purple-600" />}
        onClick={() => onStatClick("all")}
        className="cursor-pointer hover:bg-gray-50 transition-colors"
      />
      <StatCard
        title="En attente"
        value={pendingRequests.length}
        icon={<Clock className="h-6 w-6 text-orange-600" />}
        onClick={() => onStatClick("pending")}
        className="cursor-pointer hover:bg-gray-50 transition-colors"
      />
      <StatCard
        title="Terminées"
        value={completedRequests.length}
        icon={<CheckCircle className="h-6 w-6 text-green-600" />}
        onClick={() => onStatClick("completed")}
        className="cursor-pointer hover:bg-gray-50 transition-colors"
      />
      <StatCard
        title="En retard"
        value={lateRequests.length}
        icon={<AlertCircle className="h-6 w-6 text-red-600" />}
        onClick={() => onStatClick("late")}
        className="cursor-pointer hover:bg-gray-50 transition-colors"
      />
    </div>
  );
};
