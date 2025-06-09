
import React from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isWeekend, isSameWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TeleworkCalendarProps {
  currentDate: Date;
  teleworkDays: string[];
  onDayClick: (date: Date) => void;
  isProcessing: boolean;
  isReadOnly?: boolean;
}

export const TeleworkCalendar: React.FC<TeleworkCalendarProps> = ({
  currentDate,
  teleworkDays,
  onDayClick,
  isProcessing,
  isReadOnly = false
}) => {
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Générer le calendrier
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Vérifier si un jour est en télétravail
  const isDayTelework = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return teleworkDays.includes(dateString);
  };

  // Compter les jours de télétravail dans la même semaine
  const getTeleworkCountForWeek = (date: Date) => {
    return allDays
      .filter(day => isSameWeek(day, date, { weekStartsOn: 1 }))
      .filter(day => isDayTelework(day))
      .length;
  };

  // Vérifier si on peut ajouter du télétravail
  const canAddTelework = (date: Date) => {
    if (isWeekend(date) || isDayTelework(date) || isReadOnly) return false;
    return getTeleworkCountForWeek(date) < 2;
  };

  // Gérer le clic sur un jour
  const handleDayClick = (date: Date) => {
    if (isProcessing || isWeekend(date) || isReadOnly) return;
    
    const hasTelework = isDayTelework(date);
    
    if (hasTelework) {
      if (window.confirm("Supprimer ce jour de télétravail ?")) {
        onDayClick(date);
      }
    } else if (canAddTelework(date)) {
      onDayClick(date);
    }
  };

  return (
    <div className="bg-white rounded-lg border">
      {/* En-tête des jours */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day) => (
          <div key={day} className="p-3 text-center font-medium text-gray-600 border-r last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Grille du calendrier */}
      <div className="grid grid-cols-7">
        {allDays.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isTodayDate = isToday(day);
          const isWeekendDate = isWeekend(day);
          const hasTelework = isDayTelework(day);
          const canAdd = canAddTelework(day);

          return (
            <div
              key={index}
              className={cn(
                "min-h-[100px] p-2 border-r border-b last:border-r-0 relative transition-all duration-200",
                !isCurrentMonth && "bg-gray-50 text-gray-400",
                isTodayDate && "bg-blue-50 border-blue-200",
                isWeekendDate && "bg-gray-100 cursor-not-allowed",
                !isWeekendDate && !isProcessing && !isReadOnly && "cursor-pointer hover:bg-gray-50",
                isReadOnly && !isWeekendDate && "cursor-default",
                hasTelework && "bg-blue-100 border-blue-300",
                !canAdd && !hasTelework && !isWeekendDate && "opacity-50",
                isProcessing && "pointer-events-none opacity-70"
              )}
              onClick={() => handleDayClick(day)}
            >
              {/* Numéro du jour */}
              <div className={cn(
                "text-sm font-medium mb-1",
                isTodayDate && "text-blue-600",
                hasTelework && "text-blue-800 font-bold"
              )}>
                {format(day, 'd')}
              </div>

              {/* Badge télétravail */}
              {hasTelework && (
                <div className="text-xs px-2 py-1 rounded text-white bg-blue-600 font-semibold">
                  Télétravail
                </div>
              )}

              {/* Indicateurs pour les jours modifiables */}
              {!isReadOnly && (
                <>
                  {!isWeekendDate && !hasTelework && canAdd && (
                    <div className="text-xs text-gray-500 mt-1">
                      + Télétravail
                    </div>
                  )}
                  
                  {!isWeekendDate && !hasTelework && !canAdd && (
                    <div className="text-xs text-red-500 mt-1">
                      Limite 2j/sem
                    </div>
                  )}
                </>
              )}
              
              {/* Indicateur lecture seule */}
              {isReadOnly && hasTelework && (
                <div className="text-xs text-gray-500 mt-1">
                  Consultation
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
