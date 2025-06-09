
import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { Mission } from "@/types/types";
import { CalendarDay } from "@/types/calendar";

interface DraggableMissionProps {
  mission: Mission;
  day: CalendarDay;
  onClick: (mission: Mission) => void;
  getMissionColor: (mission: Mission) => {
    background: string;
    border: string;
    text: string;
  };
}

export const DraggableMission: React.FC<DraggableMissionProps> = ({
  mission,
  day,
  onClick,
  getMissionColor
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id: `mission-${mission.id}-${day.date.getTime()}`,
    data: {
      mission,
      sourceDate: day.date
    }
  });

  const colors = getMissionColor(mission);
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        ${colors.background} ${colors.border} ${colors.text}
        border rounded px-1 py-0.5 text-xs cursor-pointer
        hover:opacity-80 transition-opacity
        ${isDragging ? 'opacity-50' : ''}
        relative z-10
      `}
      onClick={(e) => {
        e.stopPropagation();
        onClick(mission);
      }}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-center gap-1">
        {mission.type === 'Full' ? '●' : '◐'}
        <span className="truncate font-medium">{mission.name}</span>
      </div>
      <div className="text-xs opacity-90 truncate">
        {mission.client}
      </div>
    </div>
  );
};
