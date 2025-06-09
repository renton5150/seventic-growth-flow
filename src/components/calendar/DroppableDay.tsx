
import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { CalendarDay } from "@/types/calendar";
import { Mission } from "@/types/types";
import { DraggableMission } from "./DraggableMission";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface DroppableDayProps {
  day: CalendarDay;
  onCreateMission: (date: Date) => void;
  onMissionClick: (mission: Mission) => void;
  onDragStart: (mission: Mission, sourceDate: Date) => void;
  getMissionColor: (mission: Mission) => {
    background: string;
    border: string;
    text: string;
  };
}

export const DroppableDay: React.FC<DroppableDayProps> = ({
  day,
  onCreateMission,
  onMissionClick,
  onDragStart,
  getMissionColor
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `day-${day.date.getTime()}`,
    data: {
      date: day.date,
      day
    }
  });

  const isValidWorkDay = day.isCurrentMonth && !day.isWeekend;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-24 border border-gray-200 p-1 relative group transition-colors",
        day.isCurrentMonth ? "bg-white" : "bg-gray-50",
        day.isWeekend && "bg-gray-100",
        day.isToday && "border-blue-500 border-2",
        isOver && isValidWorkDay && "bg-blue-50 border-blue-300",
        isValidWorkDay && "hover:bg-gray-50 cursor-pointer"
      )}
      onClick={() => isValidWorkDay && onCreateMission(day.date)}
    >
      {/* Numéro du jour */}
      <div className={cn(
        "flex items-center justify-between mb-1",
        !day.isCurrentMonth && "text-gray-400",
        day.isToday && "text-blue-600 font-bold"
      )}>
        <span className="text-sm font-medium">
          {day.date.getDate()}
        </span>
        
        {/* Bouton d'ajout (visible au hover sur les jours valides) */}
        {isValidWorkDay && (
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
            onClick={(e) => {
              e.stopPropagation();
              onCreateMission(day.date);
            }}
          >
            <Plus className="h-3 w-3 text-gray-500" />
          </button>
        )}
      </div>

      {/* Missions du jour */}
      <div className="space-y-1">
        {day.missions.slice(0, 3).map((mission) => (
          <DraggableMission
            key={`${mission.id}-${day.date.getTime()}`}
            mission={mission}
            day={day}
            onClick={onMissionClick}
            getMissionColor={getMissionColor}
          />
        ))}
        
        {/* Indicateur s'il y a plus de missions */}
        {day.missions.length > 3 && (
          <div className="text-xs text-gray-500 text-center py-1">
            +{day.missions.length - 3} autres
          </div>
        )}
      </div>

      {/* Indicateur de zone de drop */}
      {isOver && isValidWorkDay && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-400 bg-blue-50 bg-opacity-50 rounded flex items-center justify-center">
          <span className="text-blue-600 text-xs font-medium">
            Déposer ici
          </span>
        </div>
      )}
    </div>
  );
};
