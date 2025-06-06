
import { StatCard } from "@/components/dashboard/StatCard";
import { Users, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchRequests } from "@/services/requests/requestQueryService";
import { getAllUsers } from "@/services/userService";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

export const AdminStatsSummary = () => {
  const navigate = useNavigate();
  
  const { data: requests = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: ['admin-requests-summary'],
    queryFn: async () => {
      console.log("[AdminStatsSummary] Récupération des demandes pour les statistiques");
      return await fetchRequests();
    },
    refetchInterval: 5000
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin-users-stats'],
    queryFn: async () => {
      console.log("[AdminStatsSummary] Récupération des utilisateurs pour les statistiques");
      return await getAllUsers();
    },
    refetchInterval: 10000
  });

  // Calculer les statistiques correctement
  const pendingRequests = requests.filter(r => 
    r.workflow_status === "pending_assignment" || r.status === "pending"
  ).length;
  
  const completedRequests = requests.filter(r => 
    r.workflow_status === "completed"
  ).length;
  
  // En retard = demandes actives avec due_date dépassée
  const lateRequests = requests.filter(r => 
    r.isLate && 
    r.workflow_status !== 'completed' && 
    r.workflow_status !== 'canceled'
  ).length;
  
  const sdrCount = users.filter(u => u.role === "sdr").length;
  const growthCount = users.filter(u => u.role === "growth").length;

  console.log(`[AdminStatsSummary] Statistiques calculées:`, {
    totalRequests: requests.length,
    pendingRequests,
    completedRequests,
    lateRequests,
    totalUsers: users.length,
    sdrCount,
    growthCount
  });

  const handleStatClick = (filterType: string) => {
    switch (filterType) {
      case "users":
        navigate("/admin/users");
        break;
      case "pending":
        navigate("/growth", { state: { filter: "pending" } });
        break;
      case "completed":
        navigate("/archives");
        break;
      case "late":
        navigate("/growth", { state: { filter: "late" } });
        break;
    }
  };

  if (isLoadingRequests || isLoadingUsers) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Utilisateurs"
        value={users.length}
        icon={<Users size={24} className="text-blue-500" />}
        details={`${sdrCount} SDR, ${growthCount} Growth`}
        onClick={() => handleStatClick("users")}
      />
      <StatCard
        title="En attente"
        value={pendingRequests}
        icon={<Clock size={24} className="text-status-pending" />}
        onClick={() => handleStatClick("pending")}
      />
      <StatCard
        title="Terminées"
        value={completedRequests}
        icon={<CheckCircle size={24} className="text-status-completed" />}
        onClick={() => handleStatClick("completed")}
      />
      <StatCard
        title="En retard"
        value={lateRequests}
        icon={<AlertCircle size={24} className="text-status-late" />}
        onClick={() => handleStatClick("late")}
      />
    </div>
  );
};
