
import { Mission } from "@/types/types";
import { useNavigate } from "react-router-dom";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, getWeek, addMonths, subMonths, isSameMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";

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
  const [view, setView] = useState<"month" | "quarter" | "year">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Obtenir les dates à afficher selon la vue sélectionnée
  const getDaysToDisplay = () => {
    if (view === "month") {
      const firstDay = startOfMonth(currentDate);
      const lastDay = endOfMonth(currentDate);
      return eachDayOfInterval({ start: firstDay, end: lastDay });
    } else if (view === "quarter") {
      const firstDay = startOfMonth(currentDate);
      const lastDay = endOfMonth(addMonths(currentDate, 2));
      return eachDayOfInterval({ start: firstDay, end: lastDay });
    } else { // year view
      const firstDay = startOfMonth(currentDate);
      const lastDay = endOfMonth(addMonths(currentDate, 11));
      return eachDayOfInterval({ start: firstDay, end: lastDay });
    }
  };

  const daysToDisplay = getDaysToDisplay();

  // Effet pour écouter les changements de vue depuis PlanningHeader
  useEffect(() => {
    // On écoute les événements personnalisés pour changer de vue
    const handleViewChange = (e: CustomEvent) => {
      if (e.detail && e.detail.view) {
        setView(e.detail.view);
      }
    };

    // Ajouter l'écouteur d'événement
    document.addEventListener('planningViewChange' as any, handleViewChange as EventListener);
    
    // Nettoyer l'écouteur d'événement
    return () => {
      document.removeEventListener('planningViewChange' as any, handleViewChange as EventListener);
    };
  }, []);

  // Grouper les missions par SDR
  const missionsBySdr = missions.reduce((acc, mission) => {
    const sdrName = mission.sdrName || 'SDR non assigné';
    if (!acc[sdrName]) {
      acc[sdrName] = [];
    }
    acc[sdrName].push(mission);
    return acc;
  }, {} as Record<string, Mission[]>);

  // Fonction pour obtenir la couleur de mission
  const getMissionColor = (index: number) => {
    return missionColors[index % missionColors.length];
  };

  // Vérifier si la date est aujourd'hui
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  // Déterminer si nous affichons le mois complet ou juste quelques jours (pour la vue trimestrielle/annuelle)
  const shouldDisplayMonth = (date: Date) => {
    return isSameMonth(date, currentDate) || view !== "month";
  };

  // Gérer le clic sur une mission
  const handleMissionClick = (missionId: string) => {
    navigate(`/missions/${missionId}`);
  };
  
  // Formater le nom du mois
  const getMonthName = (date: Date) => {
    return format(date, 'MMMM yyyy', { locale: fr });
  };
  
  // Obtenir les mois uniques à afficher
  const getUniqueMonths = () => {
    const months: Date[] = [];
    daysToDisplay.forEach(day => {
      if (!months.some(m => isSameMonth(m, day))) {
        months.push(day);
      }
    });
    return months;
  };
  
  const uniqueMonths = getUniqueMonths();

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* En-tête avec l'échelle de temps */}
      <div className="grid grid-cols-[200px_minmax(0,1fr)] border-b">
        <div className="p-4 font-medium border-r bg-gray-50">SDR / Missions</div>
        <div>
          {/* Ligne des mois (pour vue trimestrielle/annuelle) */}
          {view !== "month" && (
            <div className="grid border-b">
              {uniqueMonths.map((month, index) => {
                const daysInMonth = daysToDisplay.filter(day => isSameMonth(day, month));
                return (
                  <div 
                    key={`month-${month.toString()}`}
                    className="px-2 py-1 text-center font-medium bg-gray-50 border-r last:border-r-0"
                    style={{
                      gridColumn: `span ${daysInMonth.length}`
                    }}
                  >
                    {getMonthName(month)}
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Ligne des semaines */}
          <div className="grid border-b bg-gray-50">
            {daysToDisplay.map((day, index) => {
              const weekNumber = getWeek(day, { locale: fr });
              const isFirstDayOfWeek = index === 0 || getWeek(daysToDisplay[index - 1], { locale: fr }) !== weekNumber;
              
              if (isFirstDayOfWeek) {
                const daysInWeek = daysToDisplay.filter((d, i) => i >= index && getWeek(d, { locale: fr }) === weekNumber);
                return (
                  <div 
                    key={`week-${day.toString()}`}
                    className="px-2 py-1 text-center font-medium border-r last:border-r-0"
                    style={{
                      gridColumn: `span ${daysInWeek.length}`
                    }}
                  >
                    Semaine {weekNumber}
                  </div>
                );
              }
              return null;
            })}
          </div>
          
          {/* Ligne des jours */}
          <div className="flex bg-gray-50">
            {daysToDisplay.map((day) => {
              const dayNum = format(day, 'd', { locale: fr });
              const dayOfWeek = format(day, 'EEE', { locale: fr });
              const weekend = isWeekend(day);
              const today = isToday(day);
              
              return (
                <div 
                  key={day.toString()} 
                  className={`
                    flex-1 min-w-8 px-1 py-1 text-center border-r last:border-r-0
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
      </div>

      {/* Corps du planning avec les missions groupées par SDR */}
      <div className="grid grid-cols-[200px_minmax(0,1fr)]">
        {Object.entries(missionsBySdr).length === 0 ? (
          <div className="col-span-2 p-8 text-center text-gray-500">
            Aucune mission disponible pour cette période.
          </div>
        ) : (
          Object.entries(missionsBySdr).map(([sdrName, sdrMissions], sdrIndex) => (
            <div key={sdrName} className="contents">
              <div className="p-4 border-b border-r font-medium bg-white">
                {sdrName}
              </div>
              <div className="relative min-h-[70px] bg-white border-b">
                <div className="flex h-full">
                  {daysToDisplay.map((day) => (
                    <div 
                      key={day.toString()} 
                      className={`
                        flex-1 min-w-8 border-r last:border-r-0
                        ${isToday(day) ? 'bg-blue-50' : ''}
                        ${isWeekend(day) ? 'bg-gray-50' : ''}
                      `}
                    />
                  ))}
                </div>
                
                {/* Placer les missions sur la timeline */}
                <div className="absolute inset-0 px-2 py-2">
                  <TooltipProvider>
                    {sdrMissions.map((mission, missionIndex) => {
                      if (!mission.startDate) return null;
                      
                      // Déterminer la position et la largeur de la mission
                      const startDate = new Date(mission.startDate);
                      const endDate = mission.endDate ? new Date(mission.endDate) : new Date();
                      
                      // Vérifier si la mission est visible dans la période affichée
                      const isVisible = daysToDisplay.some(day => 
                        (startDate <= day && (!mission.endDate || endDate >= day))
                      );
                      
                      if (!isVisible) return null;
                      
                      // Calculer la position de début (en pourcentage)
                      const firstDisplayDay = daysToDisplay[0];
                      const lastDisplayDay = daysToDisplay[daysToDisplay.length - 1];
                      
                      // Si la date de début est avant la première date affichée
                      const effectiveStartDate = startDate < firstDisplayDay ? firstDisplayDay : startDate;
                      
                      // Si la date de fin est après la dernière date affichée
                      const effectiveEndDate = !mission.endDate || endDate > lastDisplayDay ? lastDisplayDay : endDate;
                      
                      // Calculer le nombre de jours entre le début et le premier jour affiché
                      const daysFromStart = Math.max(0, Math.floor((effectiveStartDate.getTime() - firstDisplayDay.getTime()) / (1000 * 60 * 60 * 24)));
                      
                      // Calculer le nombre de jours jusqu'à la fin
                      const daysUntilEnd = Math.floor((effectiveEndDate.getTime() - firstDisplayDay.getTime()) / (1000 * 60 * 60 * 24));
                      
                      // Calculer la largeur en jours
                      const widthInDays = Math.max(1, daysUntilEnd - daysFromStart + 1);
                      
                      // Convertir en pourcentage
                      const totalDays = daysToDisplay.length;
                      const startPercentage = (daysFromStart / totalDays) * 100;
                      const widthPercentage = (widthInDays / totalDays) * 100;

                      return (
                        <Tooltip key={mission.id}>
                          <TooltipTrigger asChild>
                            <div
                              className={`absolute h-12 ${getMissionColor(missionIndex)} 
                                rounded-md cursor-pointer border-2 hover:shadow-lg
                                flex items-center justify-center overflow-hidden`}
                              style={{
                                left: `${startPercentage}%`,
                                width: `${widthPercentage}%`,
                                top: '4px',
                              }}
                              onClick={() => handleMissionClick(mission.id)}
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
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </TooltipProvider>
                </div>
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
            onClick={() => handleMissionClick(mission.id)}
          >
            <div 
              className={`w-4 h-4 rounded-sm border ${getMissionColor(index)} cursor-pointer`} 
            />
            <span className="text-sm cursor-pointer hover:underline">{mission.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
