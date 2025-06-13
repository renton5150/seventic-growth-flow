
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
  
  console.log("[GrowthStatsCards] 📊 STATS - Calcul des statistiques pour:", {
    userRole: user?.role,
    isGrowth,
    totalRequests: allRequests.length
  });
  
  // Filtrer d'abord pour exclure les demandes terminées ET annulées
  const activeRequests = allRequests.filter(req => 
    req.workflow_status !== 'completed' && req.workflow_status !== 'canceled'
  );
  
  console.log("[GrowthStatsCards] 📊 STATS - Demandes actives:", activeRequests.length);
  
  // Calcul des statistiques
  const totalRequests = activeRequests.length;
  const pendingRequests = activeRequests.filter((r) => r.status === "pending" || r.workflow_status === "pending_assignment").length;
  const inProgressRequests = activeRequests.filter((r) => r.workflow_status === "in_progress").length;
  const completedRequests = allRequests.filter((r) => r.workflow_status === "completed").length;
  const lateRequests = activeRequests.filter((r) => r.isLate).length;
  
  // Pour Growth : demandes non assignées et assignées à lui
  const toAssignRequests = activeRequests.filter(req => !req.assigned_to).length;
  const myAssignmentsRequests = activeRequests.filter(req => req.assigned_to === user?.id).length;

  console.log("[GrowthStatsCards] 📊 STATS - Compteurs finaux:", {
    total: totalRequests,
    toAssign: toAssignRequests,
    myAssignments: myAssignmentsRequests,
    pending: pendingRequests,
    inProgress: inProgressRequests,
    completed: completedRequests,
    late: lateRequests
  });

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
            onClick={() => {
              console.log("[CLICK] En attente d'assignation clicked -> to_assign filter");
              onStatClick("to_assign");
            }}
            isActive={activeFilter === "to_assign" || activeFilter === "pending"}
          />
          <StatCard
            title="Mes demandes à traiter"
            value={myAssignmentsRequests}
            icon={<UserCheck className="h-6 w-6 text-blue-600" />}
            onClick={() => {
              console.log("[CLICK] Mes demandes à traiter clicked -> my_assignments filter");
              onStatClick("my_assignments");
            }}
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
