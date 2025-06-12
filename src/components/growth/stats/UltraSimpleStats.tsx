
import { SimpleRequest } from "@/services/requests/simpleRequestService";
import { SimpleFilterService, SimpleFilterType } from "@/services/filtering/simpleFilterService";
import { StatCard } from "@/components/dashboard/StatCard";
import { Mail, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface UltraSimpleStatsProps {
  allRequests: SimpleRequest[];
  onStatClick: (filterType: SimpleFilterType) => void;
  activeFilter?: SimpleFilterType;
}

export const UltraSimpleStats = ({ allRequests, onStatClick, activeFilter }: UltraSimpleStatsProps) => {
  const { user } = useAuth();
  
  console.log("[UltraSimpleStats] 📊 Calcul des statistiques pour:", allRequests.length, "demandes");
  
  const filterService = new SimpleFilterService(user?.id);
  const counts = filterService.calculateCounts(allRequests);
  
  console.log("[UltraSimpleStats] 📊 COMPTEURS:", counts);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        title="Total"
        value={counts.all}
        icon={<Mail className="h-6 w-6 text-purple-600" />}
        onClick={() => onStatClick('all')}
        isActive={activeFilter === 'all'}
      />
      
      <StatCard
        title="En cours"
        value={counts.in_progress}
        icon={<Clock className="h-6 w-6 text-blue-600" />}
        onClick={() => onStatClick('in_progress')}
        isActive={activeFilter === 'in_progress'}
      />
      
      <StatCard
        title="Terminées"
        value={counts.completed}
        icon={<CheckCircle className="h-6 w-6 text-green-600" />}
        onClick={() => onStatClick('completed')}
        isActive={activeFilter === 'completed'}
      />
      
      <StatCard
        title="En retard"
        value={counts.late}
        icon={<AlertCircle className="h-6 w-6 text-red-600" />}
        onClick={() => onStatClick('late')}
        isActive={activeFilter === 'late'}
      />
    </div>
  );
};
