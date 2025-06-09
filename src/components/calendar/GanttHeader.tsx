
import React from "react";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isWeekend } from "date-fns";
import { fr } from "date-fns/locale";

interface GanttHeaderProps {
  currentDate: Date;
}

export const GanttHeader: React.FC<GanttHeaderProps> = ({ currentDate }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <div className="flex bg-gray-50 border-b sticky top-0 z-10">
      {/* Colonne SDR */}
      <div className="w-48 p-3 border-r bg-white font-semibold">
        SDR
      </div>
      
      {/* Colonnes des jours */}
      <div className="flex flex-1 min-w-0">
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={`
              flex-1 min-w-[30px] p-1 text-center text-xs border-r
              ${isWeekend(day) ? 'bg-gray-100' : 'bg-white'}
            `}
          >
            <div className="font-medium">
              {format(day, 'dd', { locale: fr })}
            </div>
            <div className="text-muted-foreground">
              {format(day, 'EEE', { locale: fr })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
