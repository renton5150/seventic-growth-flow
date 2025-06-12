
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
  const { user } = useAuth();
  const isGrowth = user?.role === 'growth';
  
  console.log("📊 [DASHBOARD-STATS] Calcul des statistiques:", {
    totalRequests: requests.length,
    userRole: user?.role,
    isGrowth,
    activeFilter
  });
  
  // Total des demandes : exclure les terminées (elles vont en archives)
  const activeRequests = requests.filter((r) => r.workflow_status !== "completed");
  const totalRequests = activeRequests.length;
  
  const pendingRequests = requests.filter((r) => r.status === "pending" || r.workflow_status === "pending_assignment").length;
  const inProgressRequests = requests.filter((r) => r.workflow_status === "in_progress").length;
  const completedRequests = requests.filter((r) => r.workflow_status === "completed").length;
  const lateRequests = requests.filter((r) => r.isLate).length;
  
  // Pour Growth : demandes non assignées et assignées à lui (excluant les terminées)
  const toAssignRequests = requests.filter(req => !req.assigned_to).length;
  const myAssignmentsRequests = requests.filter(req => 
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
            title="En attente"
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
        title="Terminées"
        value={completedRequests}
        icon={<CheckCircle size={24} className="text-status-completed" />}
        onClick={() => onStatClick("completed")}
        isActive={activeFilter === "completed"}
      />
      <StatCard
        title="En retard"
        value={lateRequests}
        icon={<AlertCircle size={24} className="text-status-late" />}
        onClick={() => onStatClick("late")}
        isActive={activeFilter === "late"}
      />
    </div>
  );
};
