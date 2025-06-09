
import React from "react";
import { Mission } from "@/types/types";
import { startOfMonth, endOfMonth, differenceInDays, format } from "date-fns";
import { fr } from "date-fns/locale";

interface GanttRowProps {
  sdrName: string;
  missions: Mission[];
  onMissionClick: (mission: Mission) => void;
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
  onMissionClick
}) => {
  const currentDate = new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const totalDays = differenceInDays(monthEnd, monthStart) + 1;

  // Créer une map des couleurs par mission
  const missionColors = new Map();
  missions.forEach((mission, index) => {
    missionColors.set(mission.id, MISSION_COLORS[index % MISSION_COLORS.length]);
  });

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

  return (
    <div className="flex border-b hover:bg-gray-50">
      {/* Colonne SDR */}
      <div className="w-48 p-3 border-r bg-white font-medium">
        {sdrName}
      </div>
      
      {/* Zone des missions */}
      <div className="flex-1 relative h-16 bg-white">
        {missions.map((mission) => {
          const position = getMissionPosition(mission);
          if (!position) return null;
          
          const color = missionColors.get(mission.id);
          
          return (
            <div
              key={mission.id}
              className={`
                absolute top-2 h-12 ${color} rounded-md cursor-pointer
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
Début: ${mission.startDate ? format(new Date(mission.startDate), 'dd/MM/yyyy', { locale: fr }) : 'Non défini'}
Fin: ${mission.endDate ? format(new Date(mission.endDate), 'dd/MM/yyyy', { locale: fr }) : 'Non défini'}
Type: ${mission.type}`}
            >
              <span className="truncate px-2">
                {mission.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
