
import { Mail, Clock, CheckCircle, AlertCircle, UserCheck, ClipboardList } from "lucide-react";
import { Request } from "@/types/types";
import { StatCard } from "@/components/dashboard/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { GrowthFilterService } from "@/services/filtering/growthFilterService";

interface GrowthStatsCardsFixedProps {
  allRequests: Request[];
  onStatClick: (filterType: string) => void;
  activeFilter?: string | null;
}

export const GrowthStatsCardsFixed = ({ allRequests, onStatClick, activeFilter }: GrowthStatsCardsFixedProps) => {
  const { user } = useAuth();
  const isGrowth = user?.role === 'growth';
  
  console.log("[GrowthStatsCardsFixed] 📊 Calcul des statistiques pour:", {
    userRole: user?.role,
    isGrowth,
    totalRequests: allRequests.length,
    activeFilter
  });
  
  // UTILISATION DU SERVICE CENTRALISÉ POUR LA COHÉRENCE
  const filterService = new GrowthFilterService(user?.id);
  const counts = filterService.calculateCounts(allRequests);
  
  console.log("[GrowthStatsCardsFixed] 📊 COMPTEURS CALCULÉS:", counts);

  const handleCardClick = (filterType: string) => {
    console.log(`🎯 [GrowthStatsCardsFixed] Clic sur filtre: "${filterType}"`);
    console.log(`🎯 [GrowthStatsCardsFixed] Valeur du compteur: ${counts[filterType as keyof typeof counts]}`);
    onStatClick(filterType);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <StatCard
        title="Total des demandes"
        value={counts.all}
        icon={<Mail className="h-6 w-6 text-purple-600" />}
        onClick={() => handleCardClick("all")}
        isActive={activeFilter === "all"}
      />
      
      {isGrowth ? (
        <>
          <StatCard
            title="En attente d'assignation"
            value={counts.to_assign}
            icon={<ClipboardList className="h-6 w-6 text-orange-600" />}
            onClick={() => handleCardClick("to_assign")}
            isActive={activeFilter === "to_assign"}
          />
          <StatCard
            title="Mes demandes à traiter"
            value={counts.my_assignments}
            icon={<UserCheck className="h-6 w-6 text-blue-600" />}
            onClick={() => handleCardClick("my_assignments")}
            isActive={activeFilter === "my_assignments"}
          />
        </>
      ) : (
        <>
          <StatCard
            title="En attente"
            value={counts.pending}
            icon={<Clock className="h-6 w-6 text-orange-600" />}
            onClick={() => handleCardClick("pending")}
            isActive={activeFilter === "pending"}
          />
          <StatCard
            title="En cours"
            value={counts.inprogress}
            icon={<UserCheck className="h-6 w-6 text-blue-600" />}
            onClick={() => handleCardClick("inprogress")}
            isActive={activeFilter === "inprogress"}
          />
        </>
      )}
      
      <StatCard
        title="Terminées"
        value={counts.completed}
        icon={<CheckCircle className="h-6 w-6 text-green-600" />}
        onClick={() => handleCardClick("completed")}
        isActive={activeFilter === "completed"}
      />
      <StatCard
        title="En retard"
        value={counts.late}
        icon={<AlertCircle className="h-6 w-6 text-red-600" />}
        onClick={() => handleCardClick("late")}
        isActive={activeFilter === "late"}
      />
    </div>
  );
};
