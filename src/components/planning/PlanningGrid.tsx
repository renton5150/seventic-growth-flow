
import { Mission } from "@/types/types";
import { useNavigate } from "react-router-dom";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PlanningGridProps {
  missions: Mission[];
}

const missionColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-red-500",
];

export const PlanningGrid = ({ missions }: PlanningGridProps) => {
  const navigate = useNavigate();
  const currentDate = new Date();
  const firstDay = startOfMonth(currentDate);
  const lastDay = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: firstDay, end: lastDay });

  // Créer un map de couleurs pour chaque mission
  const getMissionColor = (index: number) => {
    return missionColors[index % missionColors.length];
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* En-tête avec les jours */}
      <div className="grid grid-cols-[200px_minmax(0,1fr)] border-b">
        <div className="p-4 font-medium border-r">SDR / Missions</div>
        <div className="grid grid-cols-31 gap-0">
          {daysInMonth.map((day) => (
            <div 
              key={day.toString()} 
              className="p-2 text-center text-sm font-medium border-r last:border-r-0"
            >
              {format(day, 'd', { locale: fr })}
            </div>
          ))}
        </div>
      </div>

      {/* Corps du planning avec les missions */}
      <div className="grid grid-cols-[200px_minmax(0,1fr)]">
        {missions.map((mission, missionIndex) => (
          <div key={mission.id} className="contents">
            <div className="p-4 border-b border-r font-medium">
              {mission.sdrName || 'SDR non assigné'}
            </div>
            <div className="grid grid-cols-31 gap-0 border-b relative">
              {mission.startDate && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`absolute top-1 bottom-1 ${getMissionColor(missionIndex)} 
                          rounded-md cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-lg`}
                        style={{
                          left: `${(new Date(mission.startDate).getDate() - 1) * (100/31)}%`,
                          right: mission.endDate 
                            ? `${100 - (new Date(mission.endDate).getDate() * (100/31))}%` 
                            : '0',
                        }}
                        onClick={() => navigate(`/missions/${mission.id}`)}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <p className="font-medium">{mission.name}</p>
                        <p>Type: {mission.type}</p>
                        <p>Début: {mission.startDate ? format(new Date(mission.startDate), 'dd/MM/yyyy', { locale: fr }) : 'Non défini'}</p>
                        <p>Fin: {mission.endDate ? format(new Date(mission.endDate), 'dd/MM/yyyy', { locale: fr }) : 'En cours'}</p>
                        <p>Status: {mission.status}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {daysInMonth.map((day) => (
                <div 
                  key={day.toString()} 
                  className="h-16 border-r last:border-r-0"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
