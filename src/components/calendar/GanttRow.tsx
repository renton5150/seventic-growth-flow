
import React from "react";
import { Mission } from "@/types/types";
import { startOfMonth, endOfMonth, differenceInDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { Circle } from "lucide-react";

interface GanttRowProps {
  sdrName: string;
  missions: Mission[];
  onMissionClick: (mission: Mission) => void;
  currentDate: Date;
}

// Couleurs distinctes pour les missions
const MISSION_COLORS = [
  'bg-blue-500',
  'bg-green-500', 
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-red-500',
  'bg-yellow-500',
  'bg-teal-500',
  'bg-cyan-500'
];

export const GanttRow: React.FC<GanttRowProps> = ({
  sdrName,
  missions,
  onMissionClick,
  currentDate
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const totalDays = differenceInDays(monthEnd, monthStart) + 1;

  const mission = missions[0]; // Une seule mission par ligne maintenant
  
  // Utiliser l'ID de la mission pour déterminer la couleur de façon consistante
  const colorIndex = mission.id ? parseInt(mission.id.slice(-2), 16) % MISSION_COLORS.length : 0;
  const missionColor = MISSION_COLORS[colorIndex];

  const getMissionPosition = (mission: Mission) => {
    if (!mission.startDate) return null;
    
    const startDate = new Date(mission.startDate);
    const endDate = mission.endDate ? new Date(mission.endDate) : startDate;
    
    // Calculer la position et la largeur en pourcentage
    const startDay = Math.max(0, differenceInDays(startDate, monthStart));
    const endDay = Math.min(totalDays - 1, differenceInDays(endDate, monthStart));
    const duration = Math.max(1, endDay - startDay + 1);
    
    const leftPercent = (startDay / totalDays) * 100;
    const widthPercent = (duration / totalDays) * 100;
    
    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
      startDay,
      endDay,
      duration
    };
  };

  const position = getMissionPosition(mission);

  // Composant pour l'indicateur de type de mission
  const MissionTypeIndicator = ({ type }: { type: string }) => {
    if (type === "Full") {
      return <Circle className="h-3 w-3 fill-current" />;
    } else if (type === "Part") {
      return <Circle className="h-3 w-3" />;
    }
    return null;
  };

  return (
    <div className="flex border-b hover:bg-gray-50">
      {/* Colonne SDR */}
      <div className="w-48 p-3 border-r bg-white">
        <div className="font-medium text-sm">{sdrName}</div>
        <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
          <MissionTypeIndicator type={mission.type} />
          {mission.name}
        </div>
      </div>
      
      {/* Zone de la mission */}
      <div className="flex-1 relative h-16 bg-white">
        {position && (
          <div
            className={`
              absolute top-2 h-12 ${missionColor} rounded-md cursor-pointer
              flex items-center justify-center text-white text-xs font-medium
              hover:opacity-80 transition-opacity shadow-sm
            `}
            style={{
              left: position.left,
              width: position.width,
              minWidth: '60px'
            }}
            onClick={() => onMissionClick(mission)}
            title={`${mission.name} - ${mission.client}
Type: ${mission.type} ${mission.type === 'Full' ? '(●)' : '(○)'}
Début: ${mission.startDate ? format(new Date(mission.startDate), 'dd/MM/yyyy', { locale: fr }) : 'Non défini'}
Fin: ${mission.endDate ? format(new Date(mission.endDate), 'dd/MM/yyyy', { locale: fr }) : 'Non défini'}`}
          >
            <MissionTypeIndicator type={mission.type} />
            <span className="truncate px-2">
              {mission.client || mission.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
