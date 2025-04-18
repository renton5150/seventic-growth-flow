
import { Mission } from "@/types/types";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PlanningGridProps {
  missions: Mission[];
}

export const PlanningGrid = ({ missions }: PlanningGridProps) => {
  const navigate = useNavigate();

  // Regrouper les missions par SDR
  const missionsBySdr = missions.reduce((acc, mission) => {
    if (!acc[mission.sdrId]) {
      acc[mission.sdrId] = [];
    }
    acc[mission.sdrId].push(mission);
    return acc;
  }, {} as Record<string, Mission[]>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "En cours":
        return "bg-green-500";
      case "Fin":
        return "bg-gray-500";
      default:
        return "bg-blue-500";
    }
  };

  return (
    <div className="relative overflow-x-auto">
      <div className="min-w-full border rounded-lg">
        {Object.entries(missionsBySdr).map(([sdrId, sdrMissions]) => {
          const sdrName = sdrMissions[0]?.sdrName || "SDR inconnu";
          
          return (
            <div key={sdrId} className="border-b last:border-b-0">
              <div className="p-4 bg-muted/50">
                <h3 className="font-medium">{sdrName}</h3>
              </div>
              <div className="p-4">
                {sdrMissions.map((mission) => (
                  <TooltipProvider key={mission.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "mb-2 p-2 rounded cursor-pointer",
                            getStatusColor(mission.status)
                          )}
                          onClick={() => navigate(`/missions/${mission.id}`)}
                        >
                          <span className="text-white font-medium">
                            {mission.name}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <p className="font-medium">{mission.name}</p>
                          <p>Type: {mission.type}</p>
                          <p>Début: {mission.startDate ? format(new Date(mission.startDate), 'dd/MM/yyyy', { locale: fr }) : 'Non défini'}</p>
                          <p>Fin: {mission.endDate ? format(new Date(mission.endDate), 'dd/MM/yyyy', { locale: fr }) : 'Non défini'}</p>
                          <p>Status: {mission.status}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
