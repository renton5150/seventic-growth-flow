
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
  
  console.log("[GrowthStatsCards] 🎯 DÉBOGAGE COMPLET - user:", user);
  console.log("[GrowthStatsCards] 🎯 user?.role:", user?.role);
  console.log("[GrowthStatsCards] 🎯 typeof user?.role:", typeof user?.role);
  console.log("[GrowthStatsCards] 🎯 user?.role === 'growth':", user?.role === 'growth');
  
  // CORRECTION: Utiliser une vérification plus robuste
  const isGrowth = user?.role === 'growth';
  
  console.log("[GrowthStatsCards] 🎯 isGrowth final:", isGrowth);
  
  // LOGS DE DÉBOGAGE - Utilisateur connecté
  console.log("[GrowthStatsCards] Utilisateur connecté:", {
    id: user?.id,
    email: user?.email,
    role: user?.role,
    name: user?.name
  });
  
  // LOGS DE DÉBOGAGE - Structure des demandes
  console.log("[GrowthStatsCards] Total des demandes reçues:", allRequests.length);
  allRequests.forEach((req, index) => {
    if (index < 5) { // Limiter le nombre pour éviter d'encombrer la console
      console.log(`[GrowthStatsCards] Demande #${index}:`, {
        id: req.id,
        title: req.title,
        assigned_to: req.assigned_to,
        workflow_status: req.workflow_status,
        createdBy: req.createdBy,
        status: req.status,
        isNotAssigned: !req.assigned_to,
        isMyRequest: req.assigned_to === user?.id
      });
    }
  });
  
  // Pour Growth : demandes non assignées (utiliser assigned_to au lieu de assignedTo)
  const toAssignRequests = allRequests.filter(req => !req.assigned_to);
  console.log("[GrowthStatsCards] Demandes non assignées (to_assign):", toAssignRequests.length);
  
  // Pour Growth : demandes assignées à lui
  const myAssignmentsRequests = allRequests.filter(req => req.assigned_to === user?.id);
  console.log("[GrowthStatsCards] Mes demandes assignées:", myAssignmentsRequests.length);
  
  // Pour les autres rôles : logique classique
  const pendingRequests = allRequests.filter(req => req.workflow_status === "pending_assignment");
  const inProgressRequests = allRequests.filter(req => req.workflow_status === "in_progress");
  
  const completedRequests = allRequests.filter(req => req.workflow_status === "completed");
  const lateRequests = allRequests.filter(req => req.isLate);
  const totalRequests = allRequests.length;

  console.log("[GrowthStatsCards] COMPTEURS FINAUX:", {
    total: totalRequests,
    toAssign: toAssignRequests.length,
    myAssignments: myAssignmentsRequests.length,
    pending: pendingRequests.length,
    inProgress: inProgressRequests.length,
    completed: completedRequests.length,
    late: lateRequests.length
  });

  console.log("[GrowthStatsCards] 🎯 RENDU DES CARTES - isGrowth:", isGrowth);
  console.log("[GrowthStatsCards] 🎯 CARTES QUI VONT ÊTRE AFFICHÉES:", isGrowth ? "Growth Cards" : "Standard Cards");

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
            title="En attente"
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
