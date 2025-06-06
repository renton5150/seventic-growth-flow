
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
      console.log("[AdminStatsSummary] 🔄 Récupération des demandes pour statistiques admin");
      const allRequests = await fetchRequests();
      console.log(`[AdminStatsSummary] 📊 Total demandes récupérées: ${allRequests.length}`);
      
      // Log détaillé des statuts
      const statusBreakdown = allRequests.reduce((acc, req) => {
        const status = req.workflow_status || req.status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log("[AdminStatsSummary] 📈 Répartition des statuts:", statusBreakdown);
      
      return allRequests;
    },
    refetchInterval: 5000
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin-users-stats'],
    queryFn: async () => {
      console.log("[AdminStatsSummary] 👥 Récupération des utilisateurs");
      const allUsers = await getAllUsers();
      console.log(`[AdminStatsSummary] 👤 Total utilisateurs: ${allUsers.length}`);
      
      // Log détaillé des rôles
      const roleBreakdown = allUsers.reduce((acc, user) => {
        acc[user.role || 'undefined'] = (acc[user.role || 'undefined'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log("[AdminStatsSummary] 🎭 Répartition des rôles:", roleBreakdown);
      
      return allUsers;
    },
    refetchInterval: 10000
  });

  // Calculer les statistiques avec logs détaillés
  const calculateStats = () => {
    console.log("[AdminStatsSummary] 🧮 Calcul des statistiques...");
    
    // Demandes en attente - soit pending_assignment, soit status pending
    const pendingRequests = requests.filter(r => {
      const isPending = r.workflow_status === "pending_assignment" || r.status === "pending";
      if (isPending) {
        console.log(`[AdminStatsSummary] 📋 Demande en attente: ${r.id} - workflow: ${r.workflow_status}, status: ${r.status}`);
      }
      return isPending;
    });
    
    // Demandes terminées
    const completedRequests = requests.filter(r => {
      const isCompleted = r.workflow_status === "completed";
      if (isCompleted) {
        console.log(`[AdminStatsSummary] ✅ Demande terminée: ${r.id}`);
      }
      return isCompleted;
    });
    
    // Demandes en retard - actives avec due_date dépassée
    const now = new Date();
    const lateRequests = requests.filter(r => {
      const isActive = r.workflow_status !== 'completed' && r.workflow_status !== 'canceled';
      const isLate = r.isLate || (r.dueDate && new Date(r.dueDate) < now);
      const isActuallyLate = isActive && isLate;
      
      if (isActuallyLate) {
        console.log(`[AdminStatsSummary] ⚠️ Demande en retard: ${r.id} - due: ${r.dueDate}, workflow: ${r.workflow_status}`);
      }
      return isActuallyLate;
    });
    
    // Utilisateurs par rôle
    const sdrUsers = users.filter(u => u.role === "sdr");
    const growthUsers = users.filter(u => u.role === "growth");
    
    const stats = {
      totalUsers: users.length,
      pendingRequests: pendingRequests.length,
      completedRequests: completedRequests.length,
      lateRequests: lateRequests.length,
      sdrCount: sdrUsers.length,
      growthCount: growthUsers.length
    };

    console.log(`[AdminStatsSummary] 📊 Statistiques finales:`, stats);
    
    return stats;
  };

  const stats = calculateStats();

  const handleStatClick = (filterType: string) => {
    console.log(`[AdminStatsSummary] 🖱️ Clic sur statistique: ${filterType}`);
    
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
      default:
        console.warn(`[AdminStatsSummary] Type de filtre non reconnu: ${filterType}`);
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
        value={stats.totalUsers}
        icon={<Users size={24} className="text-blue-500" />}
        details={`${stats.sdrCount} SDR, ${stats.growthCount} Growth`}
        onClick={() => handleStatClick("users")}
      />
      <StatCard
        title="En attente"
        value={stats.pendingRequests}
        icon={<Clock size={24} className="text-status-pending" />}
        onClick={() => handleStatClick("pending")}
      />
      <StatCard
        title="Terminées"
        value={stats.completedRequests}
        icon={<CheckCircle size={24} className="text-status-completed" />}
        onClick={() => handleStatClick("completed")}
      />
      <StatCard
        title="En retard"
        value={stats.lateRequests}
        icon={<AlertCircle size={24} className="text-status-late" />}
        onClick={() => handleStatClick("late")}
      />
    </div>
  );
};
