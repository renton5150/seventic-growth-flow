
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

  // Log pour debug des stats et de l'état actif
  useEffect(() => {
    console.log("[ULTRA FIX] DashboardStats - État actuel:", {
      total: totalRequests,
      pending: pendingRequests, 
      completed: completedRequests, 
      late: lateRequests,
      activeTab
    });
  }, [totalRequests, pendingRequests, completedRequests, lateRequests, activeTab]);

  // Implémentation ultra simple sans état local
  const handleCardClick = (filterType: "all" | "pending" | "completed" | "late") => {
    console.log("[ULTRA FIX] DashboardStats - Carte cliquée directement:", filterType);
    onStatClick(filterType);
  };

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total des demandes"
        value={totalRequests}
        icon={<Mail size={24} className="text-seventic-500" />}
        onClick={() => handleCardClick("all")}
        className={`cursor-pointer hover:bg-gray-50 transition-colors ${activeTab === 'all' ? 'bg-gray-100 border-blue-500 border-2' : ''}`}
      />
      <StatCard
        title="En attente"
        value={pendingRequests}
        icon={<Clock size={24} className="text-status-pending" />}
        onClick={() => handleCardClick("pending")}
        className={`cursor-pointer hover:bg-gray-50 transition-colors ${activeTab === 'pending' ? 'bg-gray-100 border-blue-500 border-2' : ''}`}
      />
      <StatCard
        title="Terminées"
        value={completedRequests}
        icon={<CheckCircle size={24} className="text-status-completed" />}
        onClick={() => handleCardClick("completed")}
        className={`cursor-pointer hover:bg-gray-50 transition-colors ${activeTab === 'completed' ? 'bg-gray-100 border-blue-500 border-2' : ''}`}
      />
      <StatCard
        title="En retard"
        value={lateRequests}
        icon={<AlertCircle size={24} className="text-status-late" />}
        onClick={() => handleCardClick("late")}
        className={`cursor-pointer hover:bg-gray-50 transition-colors ${activeTab === 'late' ? 'bg-gray-100 border-blue-500 border-2' : ''}`}
      />
    </div>
  );
};
