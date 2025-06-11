
import { Mail, Clock, CheckCircle, AlertCircle, UserCheck, ClipboardList } from "lucide-react";
import { Request } from "@/types/types";
import { StatCard } from "@/components/dashboard/StatCard";
import { useAuth } from "@/contexts/AuthContext";

interface GrowthStatsCardsProps {
  allRequests: Request[];
  onStatClick: (filterType: "all" | "pending" | "completed" | "late" | "inprogress" | "to_assign" | "my_assignments") => void;
  activeFilter?: string | null;
}

export const GrowthStatsCards = ({ allRequests, onStatClick, activeFilter }: GrowthStatsCardsProps) => {
  const { user } = useAuth();
  const isGrowth = user?.role === 'growth';
  
  console.log("[GrowthStatsCards] 🎯 DÉBOGAGE - user role:", user?.role);
  console.log("[GrowthStatsCards] 🎯 isGrowth:", isGrowth);
  console.log("[GrowthStatsCards] 🎯 allRequests reçues:", allRequests.length);
  
  // Filtrer d'abord pour exclure les demandes terminées ET annulées
  const activeRequests = allRequests.filter(req => 
    req.workflow_status !== 'completed' && req.workflow_status !== 'canceled'
  );
  
  console.log("[GrowthStatsCards] Total des demandes actives:", activeRequests.length);
  
  // CORRECTION: Utiliser la même logique que DashboardStats
  const totalRequests = activeRequests.length;
  const pendingRequests = activeRequests.filter((r) => r.status === "pending" || r.workflow_status === "pending_assignment").length;
  const inProgressRequests = activeRequests.filter((r) => r.workflow_status === "in_progress").length;
  const completedRequests = allRequests.filter((r) => r.workflow_status === "completed").length;
  const lateRequests = activeRequests.filter((r) => r.isLate).length;
  
  // Pour Growth : demandes non assignées et assignées à lui (MÊME LOGIQUE que DashboardStats)
  const toAssignRequests = activeRequests.filter(req => !req.assigned_to).length;
  const myAssignmentsRequests = activeRequests.filter(req => req.assigned_to === user?.id).length;

  console.log("[GrowthStatsCards] COMPTEURS FINAUX:", {
    total: totalRequests,
    toAssign: toAssignRequests,
    myAssignments: myAssignmentsRequests,
    pending: pendingRequests,
    inProgress: inProgressRequests,
    completed: completedRequests,
    late: lateRequests,
    isGrowth
  });

  // DEBUG: Log des demandes non assignées
  const unassignedRequests = activeRequests.filter(req => !req.assigned_to);
  console.log("[GrowthStatsCards] 🔍 DÉTAIL demandes non assignées:", unassignedRequests.map(r => ({ 
    id: r.id, 
    title: r.title, 
    assigned_to: r.assigned_to,
    workflow_status: r.workflow_status 
  })));

  // DEBUG: Log des demandes assignées à l'utilisateur
  const myAssignedRequests = activeRequests.filter(req => req.assigned_to === user?.id);
  console.log("[GrowthStatsCards] 🔍 DÉTAIL mes demandes assignées:", myAssignedRequests.map(r => ({ 
    id: r.id, 
    title: r.title, 
    assigned_to: r.assigned_to,
    workflow_status: r.workflow_status 
  })));

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <StatCard
        title="Total des demandes"
        value={totalRequests}
        icon={<Mail className="h-6 w-6 text-purple-600" />}
        onClick={() => onStatClick("all")}
        isActive={activeFilter === "all"}
      />
      
      {isGrowth ? (
        <>
          <StatCard
            title="En attente d'assignation"
            value={toAssignRequests}
            icon={<ClipboardList className="h-6 w-6 text-orange-600" />}
            onClick={() => onStatClick("to_assign")}
            isActive={activeFilter === "to_assign"}
          />
          <StatCard
            title="Mes demandes à traiter"
            value={myAssignmentsRequests}
            icon={<UserCheck className="h-6 w-6 text-blue-600" />}
            onClick={() => onStatClick("my_assignments")}
            isActive={activeFilter === "my_assignments"}
          />
        </>
      ) : (
        <>
          <StatCard
            title="En attente"
            value={pendingRequests}
            icon={<Clock className="h-6 w-6 text-orange-600" />}
            onClick={() => onStatClick("pending")}
            isActive={activeFilter === "pending"}
          />
          <StatCard
            title="En cours"
            value={inProgressRequests}
            icon={<UserCheck className="h-6 w-6 text-blue-600" />}
            onClick={() => onStatClick("inprogress")}
            isActive={activeFilter === "inprogress"}
          />
        </>
      )}
      
      <StatCard
        title="Terminées"
        value={completedRequests}
        icon={<CheckCircle className="h-6 w-6 text-green-600" />}
        onClick={() => onStatClick("completed")}
        isActive={activeFilter === "completed"}
      />
      <StatCard
        title="En retard"
        value={lateRequests}
        icon={<AlertCircle className="h-6 w-6 text-red-600" />}
        onClick={() => onStatClick("late")}
        isActive={activeFilter === "late"}
      />
    </div>
  );
};
