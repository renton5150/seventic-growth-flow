
import { Mission } from "@/types/types";
import { useNavigate } from "react-router-dom";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from "date-fns";
import { fr } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface PlanningGridProps {
  missions: Mission[];
}

// Palette de couleurs plus douce et professionnelle
const missionColors = [
  "bg-blue-100 border-blue-500 text-blue-800",
  "bg-emerald-100 border-emerald-500 text-emerald-800",
  "bg-violet-100 border-violet-500 text-violet-800",
  "bg-amber-100 border-amber-500 text-amber-800",
  "bg-rose-100 border-rose-500 text-rose-800",
  "bg-cyan-100 border-cyan-500 text-cyan-800",
  "bg-indigo-100 border-indigo-500 text-indigo-800",
  "bg-lime-100 border-lime-500 text-lime-800",
];

export const PlanningGrid = ({ missions }: PlanningGridProps) => {
  const navigate = useNavigate();
  const currentDate = new Date();
  const firstDay = startOfMonth(currentDate);
  const lastDay = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: firstDay, end: lastDay });

  // Fonction pour obtenir la couleur de mission
  const getMissionColor = (index: number) => {
    return missionColors[index % missionColors.length];
  };

  // Formater la date pour l'affichage
  const formatDate = (date: Date) => {
    const day = format(date, 'd', { locale: fr });
    const dayOfWeek = format(date, 'EEE', { locale: fr });
    return { day, dayOfWeek };
  };

  // Vérifier si la date est aujourd'hui
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* En-tête avec l'échelle de temps */}
      <div className="grid grid-cols-[200px_minmax(0,1fr)] border-b">
        <div className="p-4 font-medium border-r bg-gray-50">SDR / Missions</div>
        <div className="grid grid-cols-31 gap-0 bg-gray-50">
          {daysInMonth.map((day) => {
            const { day: dayNum, dayOfWeek } = formatDate(day);
            const weekend = isWeekend(day);
            const today = isToday(day);
            
            return (
              <div 
                key={day.toString()} 
                className={`
                  px-2 py-1 text-center border-r last:border-r-0
                  ${weekend ? 'bg-gray-100' : ''}
                  ${today ? 'bg-blue-50 font-bold' : ''}
                `}
              >
                <div className="text-xs text-gray-500">{dayOfWeek}</div>
                <div className={`text-sm font-medium ${today ? 'text-blue-600' : ''}`}>{dayNum}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Corps du planning avec les missions */}
      <div className="grid grid-cols-[200px_minmax(0,1fr)]">
        {missions.length === 0 ? (
          <div className="col-span-2 p-8 text-center text-gray-500">
            Aucune mission disponible pour ce mois.
          </div>
        ) : (
          missions.map((mission, missionIndex) => (
            <div key={mission.id} className="contents">
              <div className="p-4 border-b border-r font-medium bg-white">
                {mission.sdrName || 'SDR non assigné'}
              </div>
              <div className="grid grid-cols-31 gap-0 border-b relative min-h-[70px] bg-white">
                {mission.startDate && (
                  <TooltipProvider>
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <div
                          className={`absolute top-2 bottom-2 ${getMissionColor(missionIndex)} 
                            rounded-md cursor-pointer transition-transform border-2 hover:shadow-lg
                            flex items-center justify-center overflow-hidden`}
                          style={{
                            left: `${(new Date(mission.startDate).getDate() - 1) * (100/31)}%`,
                            right: mission.endDate 
                              ? `${100 - (new Date(mission.endDate).getDate() * (100/31))}%` 
                              : '0',
                          }}
                          onClick={() => navigate(`/missions/${mission.id}`)}
                        >
                          <span className="text-sm font-medium px-2 truncate">{mission.name}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="p-0 bg-white border shadow-lg rounded-md w-64">
                        <div className="p-3 space-y-1.5">
                          <p className="font-semibold text-lg">{mission.name}</p>
                          <div className="grid grid-cols-2 gap-x-4 text-sm">
                            <p className="text-gray-500">Type:</p>
                            <p>{mission.type}</p>
                            <p className="text-gray-500">Début:</p>
                            <p>{mission.startDate ? format(new Date(mission.startDate), 'dd/MM/yyyy', { locale: fr }) : 'Non défini'}</p>
                            <p className="text-gray-500">Fin:</p>
                            <p>{mission.endDate ? format(new Date(mission.endDate), 'dd/MM/yyyy', { locale: fr }) : 'En cours'}</p>
                            <p className="text-gray-500">Status:</p>
                            <p className="font-medium">{mission.status}</p>
                          </div>
                          <div className="pt-1 mt-2 border-t text-xs text-right">
                            <p className="text-blue-600 italic">Cliquez pour voir les détails</p>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {daysInMonth.map((day) => {
                  const isToday = (new Date()).getDate() === day.getDate();
                  const isWeekendDay = isWeekend(day);
                  
                  return (
                    <div 
                      key={day.toString()} 
                      className={`
                        border-r last:border-r-0
                        ${isToday ? 'bg-blue-50' : ''}
                        ${isWeekendDay ? 'bg-gray-50' : ''}
                      `}
                    />
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Légende des couleurs */}
      <div className="flex flex-wrap gap-4 p-4 border-t bg-gray-50">
        <div className="text-sm font-medium">Légende:</div>
        {missions.slice(0, 8).map((mission, index) => (
          <div 
            key={mission.id} 
            className="flex items-center gap-2"
          >
            <div 
              className={`w-4 h-4 rounded-sm border ${getMissionColor(index)}`} 
            />
            <span className="text-sm">{mission.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
