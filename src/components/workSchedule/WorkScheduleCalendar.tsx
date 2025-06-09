
import React from "react";
import { WorkScheduleCalendarDay, WorkScheduleRequest } from "@/types/workSchedule";
import { format, isWeekend, startOfWeek, isSameWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface WorkScheduleCalendarProps {
  calendarData: {
    weeks: { days: WorkScheduleCalendarDay[] }[];
    currentDate: Date;
  };
  onDayClick: (date: Date) => void;
  onRequestClick: (request: WorkScheduleRequest) => void;
  isAdmin: boolean;
  userId: string;
  onDirectTeleworkAdd?: (date: Date) => void;
}

export const WorkScheduleCalendar: React.FC<WorkScheduleCalendarProps> = ({
  calendarData,
  onDayClick,
  onRequestClick,
  isAdmin,
  userId,
  onDirectTeleworkAdd
}) => {
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const handleDayClick = async (date: Date, dayRequests: WorkScheduleRequest[]) => {
    console.log("[Calendar] Clic sur date:", format(date, 'yyyy-MM-dd'));
    
    // Si c'est un weekend, ne rien faire
    if (isWeekend(date)) {
      console.log("[Calendar] Weekend ignoré");
      return;
    }

    // Vérifier s'il y a déjà une demande de télétravail pour ce jour
    const existingTelework = dayRequests.find(r => r.request_type === 'telework' && r.user_id === userId);
    
    if (existingTelework) {
      // Si télétravail existe déjà, on le supprime
      console.log("[Calendar] Suppression télétravail existant:", existingTelework.id);
      onRequestClick(existingTelework);
    } else {
      // Vérifier la limite de 2 jours par semaine
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const teleworkThisWeek = calendarData.weeks
        .flatMap(week => week.days)
        .filter(day => 
          isSameWeek(day.date, date, { weekStartsOn: 1 }) &&
          day.requests.some(r => r.request_type === 'telework' && r.user_id === userId)
        ).length;

      if (teleworkThisWeek >= 2) {
        console.log("[Calendar] Maximum 2 jours de télétravail par semaine atteint");
        return;
      }

      // Ajouter directement le télétravail
      if (onDirectTeleworkAdd) {
        console.log("[Calendar] Ajout télétravail pour:", format(date, 'yyyy-MM-dd'));
        onDirectTeleworkAdd(date);
      } else {
        console.log("[Calendar] ERREUR: onDirectTeleworkAdd non défini");
      }
    }
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
            const teleworkCount = calendarData.weeks
              .flatMap(w => w.days)
              .filter(d => 
                isSameWeek(d.date, day.date, { weekStartsOn: 1 }) &&
                d.requests.some(r => r.request_type === 'telework' && r.user_id === userId)
              ).length;
            
            const canAddTelework = !isWeekend(day.date) && teleworkCount < 2;
            const hasTelework = day.requests.some(r => r.request_type === 'telework' && r.user_id === userId);
            
            return (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className={cn(
                  "min-h-[100px] p-2 border-r border-b last:border-r-0",
                  !day.isCurrentMonth && "bg-gray-50 text-gray-400",
                  day.isToday && "bg-blue-50 border-blue-200",
                  isWeekend(day.date) && "bg-gray-100 cursor-not-allowed",
                  !isWeekend(day.date) && "cursor-pointer hover:bg-gray-50",
                  !canAddTelework && !hasTelework && !isWeekend(day.date) && "opacity-50"
                )}
                onClick={() => {
                  console.log("[Calendar] onClick déclenché pour:", format(day.date, 'yyyy-MM-dd'));
                  handleDayClick(day.date, day.requests);
                }}
              >
                {/* Numéro du jour */}
                <div className={cn(
                  "text-sm font-medium mb-1",
                  day.isToday && "text-blue-600",
                  hasTelework && "text-blue-800 font-bold"
                )}>
                  {format(day.date, 'd')}
                </div>

                {/* Affichage du statut télétravail avec style visible */}
                {hasTelework && (
                  <div className="text-xs px-2 py-1 rounded text-white bg-blue-500 font-semibold">
                    Télétravail
                  </div>
                )}

                {/* Style de fond pour les jours de télétravail */}
                {hasTelework && (
                  <div className="absolute inset-0 bg-blue-100 opacity-30 rounded-lg pointer-events-none"></div>
                )}

                {/* Indicateur si on peut ajouter du télétravail */}
                {!isWeekend(day.date) && !hasTelework && canAddTelework && (
                  <div className="text-xs text-gray-400 mt-1 opacity-60">
                    Cliquer pour télétravail
                  </div>
                )}
                
                {/* Message si limite atteinte */}
                {!isWeekend(day.date) && !hasTelework && !canAddTelework && (
                  <div className="text-xs text-red-400 mt-1">
                    Limite 2j/semaine
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
