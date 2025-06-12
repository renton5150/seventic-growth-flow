
import { StatCard } from "@/components/dashboard/StatCard";
import { Mail, Clock, CheckCircle, AlertCircle, ArrowRightLeft, ClipboardList, UserCheck } from "lucide-react";
import { Request } from "@/types/types";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardStatsProps {
  requests: Request[];
  onStatClick: (filterType: "all" | "pending" | "completed" | "late" | "inprogress" | "to_assign" | "my_assignments") => void;
  activeFilter: string | null;
}

export const DashboardStats = ({ requests, onStatClick, activeFilter }: DashboardStatsProps) => {
  const { user, isSDR, isGrowth, isAdmin } = useAuth();
  
  console.log("📊 [DASHBOARD-STATS] Calcul des statistiques:", {
    totalRequests: requests.length,
    userRole: user?.role,
    isSDR,
    isGrowth,
    isAdmin,
    activeFilter
  });
  
  // Filtrer les demandes selon le rôle de l'utilisateur
  const roleFilteredRequests = requests.filter((request) => {
    if (isSDR) {
      // Les SDR ne voient que leurs demandes
      return request.createdBy === user?.id;
    } else if (isGrowth && !isAdmin) {
      // Les Growth voient toutes les demandes sauf celles pour SDR
      return request.target_role !== "sdr";
    }
    // Les Admin voient tout
    return true;
  });
  
  console.log("📊 [DASHBOARD-STATS] Demandes après filtre de rôle:", roleFilteredRequests.length);
  
  // Total des demandes : exclure les terminées (elles vont en archives)
  const activeRequests = roleFilteredRequests.filter((r) => r.workflow_status !== "completed");
  const totalRequests = activeRequests.length;
  
  // Pour SDR : "En attente" = mes demandes en attente d'assignation
  // Pour Growth/Admin : "En attente" = demandes non assignées
  const pendingRequests = isSDR 
    ? roleFilteredRequests.filter((r) => 
        r.createdBy === user?.id && 
        (!r.assigned_to || r.workflow_status === "pending_assignment") && 
        r.workflow_status !== "completed"
      ).length
    : roleFilteredRequests.filter((r) => 
        r.status === "pending" || r.workflow_status === "pending_assignment"
      ).length;
      
  const inProgressRequests = roleFilteredRequests.filter((r) => r.workflow_status === "in_progress").length;
  const completedRequests = roleFilteredRequests.filter((r) => r.workflow_status === "completed").length;
  const lateRequests = roleFilteredRequests.filter((r) => r.isLate && r.workflow_status !== "completed").length;
  
  // Pour Growth : demandes non assignées ET non terminées, assignées à lui ET non terminées
  const toAssignRequests = roleFilteredRequests.filter(req => 
    (!req.assigned_to) && req.workflow_status !== "completed"
  ).length;
  const myAssignmentsRequests = roleFilteredRequests.filter(req => 
    req.assigned_to === user?.id && req.workflow_status !== "completed"
  ).length;

  console.log("📊 [DASHBOARD-STATS] Compteurs calculés:", {
    total: totalRequests,
    pending: pendingRequests,
    inProgress: inProgressRequests,
    completed: completedRequests,
    late: lateRequests,
    toAssign: toAssignRequests,
    myAssignments: myAssignmentsRequests
  });

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-5 lg:grid-cols-5">
      <StatCard
        title="Total des demandes"
        value={totalRequests}
        icon={<Mail size={24} className="text-seventic-500" />}
        onClick={() => onStatClick("all")}
        isActive={activeFilter === "all"}
      />
      
      {isGrowth ? (
        <>
          <StatCard
            title="En attente d'assignation"
            value={toAssignRequests}
            icon={<ClipboardList size={24} className="text-status-pending" />}
            onClick={() => {
              console.log("📊 [CLICK] En attente d'assignation cliqué");
              onStatClick("to_assign");
            }}
            isActive={activeFilter === "to_assign" || activeFilter === "pending"}
          />
          <StatCard
            title="Mes demandes à traiter"
            value={myAssignmentsRequests}
            icon={<UserCheck size={24} className="text-blue-500" />}
            onClick={() => {
              console.log("📊 [CLICK] Mes demandes à traiter cliqué");
              onStatClick("my_assignments");
            }}
            isActive={activeFilter === "my_assignments"}
          />
        </>
      ) : (
        <>
          <StatCard
            title={isSDR ? "Mes demandes en attente" : "En attente"}
            value={pendingRequests}
            icon={<Clock size={24} className="text-status-pending" />}
            onClick={() => onStatClick("pending")}
            isActive={activeFilter === "pending"}
          />
          <StatCard
            title="En cours"
            value={inProgressRequests}
            icon={<ArrowRightLeft size={24} className="text-blue-500" />}
            onClick={() => onStatClick("inprogress")}
            isActive={activeFilter === "inprogress"}
          />
        </>
      )}
      
      <StatCard
        title="En retard"
        value={lateRequests}
        icon={<AlertCircle size={24} className="text-status-late" />}
        onClick={() => onStatClick("late")}
        isActive={activeFilter === "late"}
      />
      <StatCard
        title="Terminées"
        value={completedRequests}
        icon={<CheckCircle size={24} className="text-status-completed" />}
        onClick={() => onStatClick("completed")}
        isActive={activeFilter === "completed"}
      />
    </div>
  );
};
