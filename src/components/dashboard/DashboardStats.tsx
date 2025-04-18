
import { StatCard } from "@/components/dashboard/StatCard";
import { Mail, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Request } from "@/types/types";
import { useEffect, useState } from "react";

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

  // État pour forcer le rendu
  const [, forceUpdate] = useState({});

  // Log pour debug des stats
  useEffect(() => {
    console.log("[DEBUG] DashboardStats - Stats calculées:", {
      total: totalRequests,
      pending: pendingRequests,
      completed: completedRequests,
      late: lateRequests
    });
    console.log("[DEBUG] DashboardStats - ActiveTab:", activeTab);
  }, [totalRequests, pendingRequests, completedRequests, lateRequests, activeTab]);

  // Solution radicale: Implémentation directe et simplifiée
  const handleCardClick = (filterType: "all" | "pending" | "completed" | "late") => {
    console.log("[RADICAL FIX] DashboardStats - Carte cliquée:", filterType);
    
    // Appel direct à la fonction parent
    onStatClick(filterType);
    
    // Force un rendu pour s'assurer que l'UI est mise à jour
    setTimeout(() => forceUpdate({}), 0);
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
