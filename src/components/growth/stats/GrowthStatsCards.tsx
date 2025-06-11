
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
  
  // Pour Growth : demandes non assignées
  const toAssignRequests = allRequests.filter(req => !req.assigned_to);
  
  // Pour Growth : demandes assignées à lui
  const myAssignmentsRequests = allRequests.filter(req => req.assigned_to === user?.id);
  
  // Pour les autres rôles : logique classique
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
      
      {isGrowth ? (
        <>
          <StatCard
            title="En attente d'assignation"
            value={toAssignRequests.length}
            icon={<ClipboardList className="h-6 w-6 text-orange-600" />}
            onClick={() => onStatClick("to_assign")}
            isActive={activeFilter === "to_assign"}
          />
          <StatCard
            title="Mes demandes à traiter"
            value={myAssignmentsRequests.length}
            icon={<UserCheck className="h-6 w-6 text-blue-600" />}
            onClick={() => onStatClick("my_assignments")}
            isActive={activeFilter === "my_assignments"}
          />
        </>
      ) : (
        <>
          <StatCard
            title="En attente d'assignation"
            value={pendingRequests.length}
            icon={<Clock className="h-6 w-6 text-orange-600" />}
            onClick={() => onStatClick("pending")}
            isActive={activeFilter === "pending"}
          />
          <StatCard
            title="En cours"
            value={inProgressRequests.length}
            icon={<UserCheck className="h-6 w-6 text-blue-600" />}
            onClick={() => onStatClick("inprogress")}
            isActive={activeFilter === "inprogress"}
          />
        </>
      )}
      
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
