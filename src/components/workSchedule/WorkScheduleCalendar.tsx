
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
  calendarKey?: number; // Ajout d'une clé pour forcer le rafraîchissement
}

export const WorkScheduleCalendar: React.FC<WorkScheduleCalendarProps> = ({
  calendarData,
  onDayClick,
  onRequestClick,
  isAdmin,
  userId,
  onDirectTeleworkAdd,
  calendarKey = 0
}) => {
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const handleDayClick = async (date: Date, dayRequests: WorkScheduleRequest[]) => {
    const dateString = format(date, 'yyyy-MM-dd');
    console.log("[Calendar] Clic sur date:", dateString);
    
    // Si c'est un weekend, ne rien faire
    if (isWeekend(date)) {
      console.log("[Calendar] Weekend ignoré");
      return;
    }

    // Vérifier s'il y a déjà une demande de télétravail pour ce jour
    const existingTelework = dayRequests.find(r => r.request_type === 'telework' && r.user_id === userId);
    
    if (existingTelework) {
      // Si télétravail existe déjà, on le supprime
      console.log("🔥 [Calendar] Suppression télétravail existant:", existingTelework.id, "pour la date:", existingTelework.start_date);
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
        console.log("✅ [Calendar] Ajout télétravail pour:", dateString);
        onDirectTeleworkAdd(date);
      } else {
        console.log("❌ [Calendar] ERREUR: onDirectTeleworkAdd non défini");
      }
    }
  };

  // Fonction pour vérifier si un jour a du télétravail
  const isDayInWorkSchedule = (day: WorkScheduleCalendarDay) => {
    const hasTelework = day.requests.some(r => r.request_type === 'telework' && r.user_id === userId);
    
    // Debug détaillé pour diagnostiquer le problème
    if (hasTelework) {
      const formattedDate = format(day.date, 'yyyy-MM-dd');
      const teleworkRequests = day.requests.filter(r => r.request_type === 'telework' && r.user_id === userId);
      console.log(`[Calendar] Date ${formattedDate} a du télétravail:`, teleworkRequests.map(r => ({ id: r.id, date: r.start_date })));
    }
    
    return hasTelework;
  };

  return (
    <div key={calendarKey} className="bg-white rounded-lg border">
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
            const hasTelework = isDayInWorkSchedule(day);
            
            return (
              <div
                key={`${weekIndex}-${dayIndex}-${calendarKey}`}
                className={cn(
                  "min-h-[100px] p-2 border-r border-b last:border-r-0 relative transition-all duration-300",
                  !day.isCurrentMonth && "bg-gray-50 text-gray-400",
                  day.isToday && "bg-blue-50 border-blue-200",
                  isWeekend(day.date) && "bg-gray-100 cursor-not-allowed",
                  !isWeekend(day.date) && "cursor-pointer hover:bg-gray-50",
                  hasTelework && "bg-blue-100 border-blue-300 shadow-sm",
                  !canAddTelework && !hasTelework && !isWeekend(day.date) && "opacity-50"
                )}
                onClick={() => {
                  const dateString = format(day.date, 'yyyy-MM-dd');
                  console.log("[Calendar] onClick déclenché pour:", dateString, "hasTelework:", hasTelework);
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
                  <div className="text-xs px-2 py-1 rounded text-white bg-blue-600 font-semibold shadow-sm animate-in fade-in duration-200">
                    Télétravail
                  </div>
                )}

                {/* Indicateur si on peut ajouter du télétravail */}
                {!isWeekend(day.date) && !hasTelework && canAddTelework && (
                  <div className="text-xs text-gray-500 mt-1">
                    + Télétravail
                  </div>
                )}
                
                {/* Message si limite atteinte */}
                {!isWeekend(day.date) && !hasTelework && !canAddTelework && (
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
