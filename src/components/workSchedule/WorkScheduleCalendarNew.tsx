
import React from "react";
import { format, isWeekend, isSameWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  isToday: boolean;
  hasTelework: boolean;
}

interface CalendarWeek {
  days: CalendarDay[];
}

interface CalendarData {
  weeks: CalendarWeek[];
  currentDate: Date;
}

interface WorkScheduleCalendarNewProps {
  calendarData: CalendarData;
  onDayClick: (date: Date) => void;
  canAddTelework: (date: Date) => boolean;
  isProcessing: boolean;
}

export const WorkScheduleCalendarNew: React.FC<WorkScheduleCalendarNewProps> = ({
  calendarData,
  onDayClick,
  canAddTelework,
  isProcessing
}) => {
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const handleDayClick = (date: Date, day: CalendarDay) => {
    if (isProcessing) {
      console.log("[CalendarNew] Traitement en cours, clic ignoré");
      return;
    }

    if (isWeekend(date)) {
      console.log("[CalendarNew] Weekend ignoré");
      return;
    }

    const dateString = format(date, 'yyyy-MM-dd');
    console.log("[CalendarNew] Clic sur date:", dateString, "hasTelework:", day.hasTelework);
    
    onDayClick(date);
  };

  return (
    <div className="bg-white rounded-lg border">
      {/* En-tête des jours de la semaine */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day) => (
          <div key={day} className="p-3 text-center font-medium text-gray-600 border-r last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Grille du calendrier */}
      <div className="grid grid-cols-7">
        {calendarData.weeks.map((week, weekIndex) =>
          week.days.map((day, dayIndex) => {
            const canAdd = canAddTelework(day.date);
            
            return (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className={cn(
                  "min-h-[100px] p-2 border-r border-b last:border-r-0 relative transition-all duration-200",
                  !day.isCurrentMonth && "bg-gray-50 text-gray-400",
                  day.isToday && "bg-blue-50 border-blue-200",
                  isWeekend(day.date) && "bg-gray-100 cursor-not-allowed",
                  !isWeekend(day.date) && !isProcessing && "cursor-pointer hover:bg-gray-50",
                  day.hasTelework && "bg-blue-100 border-blue-300 shadow-sm",
                  !canAdd && !day.hasTelework && !isWeekend(day.date) && "opacity-50",
                  isProcessing && "pointer-events-none opacity-70"
                )}
                onClick={() => handleDayClick(day.date, day)}
              >
                {/* Numéro du jour */}
                <div className={cn(
                  "text-sm font-medium mb-1",
                  day.isToday && "text-blue-600",
                  day.hasTelework && "text-blue-800 font-bold"
                )}>
                  {format(day.date, 'd')}
                </div>

                {/* Badge télétravail */}
                {day.hasTelework && (
                  <div className="text-xs px-2 py-1 rounded text-white bg-blue-600 font-semibold shadow-sm">
                    Télétravail
                  </div>
                )}

                {/* Indicateur ajout possible */}
                {!isWeekend(day.date) && !day.hasTelework && canAdd && (
                  <div className="text-xs text-gray-500 mt-1 hover:text-blue-600">
                    + Télétravail
                  </div>
                )}
                
                {/* Message limite atteinte */}
                {!isWeekend(day.date) && !day.hasTelework && !canAdd && (
                  <div className="text-xs text-red-500 mt-1">
                    Limite 2j/sem
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
