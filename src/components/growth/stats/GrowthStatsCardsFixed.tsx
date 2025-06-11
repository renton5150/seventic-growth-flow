
import { Mail, Clock, CheckCircle, AlertCircle, UserCheck, ClipboardList } from "lucide-react";
import { Request } from "@/types/types";
import { StatCard } from "@/components/dashboard/StatCard";
import { useAuth } from "@/contexts/AuthContext";

interface GrowthStatsCardsFixedProps {
  allRequests: Request[];
  onStatClick: (filterType: string) => void;
  activeFilter?: string | null;
}

export const GrowthStatsCardsFixed = ({ allRequests, onStatClick, activeFilter }: GrowthStatsCardsFixedProps) => {
  const { user } = useAuth();
  const isGrowth = user?.role === 'growth';
  
  console.log("[GrowthStatsCardsFixed] 📊 STATS - Calcul des statistiques pour:", {
    userRole: user?.role,
    isGrowth,
    totalRequests: allRequests.length,
    activeFilter
  });
  
  // Filtrer d'abord pour exclure les demandes terminées ET annulées
  const activeRequests = allRequests.filter(req => 
    req.workflow_status !== 'completed' && req.workflow_status !== 'canceled'
  );
  
  console.log("[GrowthStatsCardsFixed] 📊 STATS - Demandes actives:", activeRequests.length);
  
  // Calcul des statistiques
  const totalRequests = activeRequests.length;
  const pendingRequests = activeRequests.filter((r) => r.status === "pending" || r.workflow_status === "pending_assignment").length;
  const inProgressRequests = activeRequests.filter((r) => r.workflow_status === "in_progress").length;
  const completedRequests = allRequests.filter((r) => r.workflow_status === "completed").length;
  const lateRequests = activeRequests.filter((r) => r.isLate).length;
  
  // Pour Growth : demandes non assignées et assignées à lui
  const toAssignRequests = activeRequests.filter(req => !req.assigned_to || req.assigned_to === 'Non assigné' || req.assigned_to === '').length;
  const myAssignmentsRequests = activeRequests.filter(req => 
    req.assigned_to === user?.id || req.assigned_to === user?.email || req.assigned_to === user?.name
  ).length;

  console.log("[GrowthStatsCardsFixed] 📊 STATS - Compteurs finaux:", {
    total: totalRequests,
    toAssign: toAssignRequests,
    myAssignments: myAssignmentsRequests,
    pending: pendingRequests,
    inProgress: inProgressRequests,
    completed: completedRequests,
    late: lateRequests
  });

  const handleCardClick = (filterType: string) => {
    console.log(`🚨 [GrowthStatsCardsFixed] CARD CLICK START - Filter demandé: "${filterType}"`);
    console.log(`🚨 [GrowthStatsCardsFixed] TYPE: ${typeof filterType}, VALUE: ${JSON.stringify(filterType)}`);
    console.log(`🚨 [GrowthStatsCardsFixed] Calling onStatClick with exact value: "${filterType}"`);
    
    // Appel direct sans modification
    onStatClick(filterType);
    
    console.log(`🚨 [GrowthStatsCardsFixed] CARD CLICK END - onStatClick called with: "${filterType}"`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <StatCard
        title="Total des demandes"
        value={totalRequests}
        icon={<Mail className="h-6 w-6 text-purple-600" />}
        onClick={() => {
          console.log("🚨 [GrowthStatsCardsFixed] TOTAL CARD CLICKED");
          handleCardClick("all");
        }}
        isActive={activeFilter === "all"}
      />
      
      {isGrowth ? (
        <>
          <StatCard
            title="En attente d'assignation"
            value={toAssignRequests}
            icon={<ClipboardList className="h-6 w-6 text-orange-600" />}
            onClick={() => {
              console.log("🚨🚨🚨 [GrowthStatsCardsFixed] EN ATTENTE D'ASSIGNATION CLICKED - EXACT MOMENT");
              console.log("🚨🚨🚨 [GrowthStatsCardsFixed] About to call handleCardClick with 'to_assign'");
              handleCardClick("to_assign");
              console.log("🚨🚨🚨 [GrowthStatsCardsFixed] handleCardClick('to_assign') COMPLETED");
            }}
            isActive={activeFilter === "to_assign"}
          />
          <StatCard
            title="Mes demandes à traiter"
            value={myAssignmentsRequests}
            icon={<UserCheck className="h-6 w-6 text-blue-600" />}
            onClick={() => {
              console.log("🚨 [GrowthStatsCardsFixed] MES DEMANDES CLICKED");
              handleCardClick("my_assignments");
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
            onClick={() => handleCardClick("pending")}
            isActive={activeFilter === "pending"}
          />
          <StatCard
            title="En cours"
            value={inProgressRequests}
            icon={<UserCheck className="h-6 w-6 text-blue-600" />}
            onClick={() => handleCardClick("inprogress")}
            isActive={activeFilter === "inprogress"}
          />
        </>
      )}
      
      <StatCard
        title="Terminées"
        value={completedRequests}
        icon={<CheckCircle className="h-6 w-6 text-green-600" />}
        onClick={() => {
          console.log("🚨 [GrowthStatsCardsFixed] TERMINÉES CLICKED");
          handleCardClick("completed");
        }}
        isActive={activeFilter === "completed"}
      />
      <StatCard
        title="En retard"
        value={lateRequests}
        icon={<AlertCircle className="h-6 w-6 text-red-600" />}
        onClick={() => {
          console.log("🚨🚨🚨 [GrowthStatsCardsFixed] EN RETARD CLICKED - EXACT MOMENT");
          console.log("🚨🚨🚨 [GrowthStatsCardsFixed] About to call handleCardClick with 'late'");
          handleCardClick("late");
          console.log("🚨🚨🚨 [GrowthStatsCardsFixed] handleCardClick('late') COMPLETED");
        }}
        isActive={activeFilter === "late"}
      />
    </div>
  );
};
