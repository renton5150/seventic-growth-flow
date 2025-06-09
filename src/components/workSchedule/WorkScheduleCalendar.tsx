
import React from "react";
import { WorkScheduleCalendarDay, WorkScheduleRequest } from "@/types/workSchedule";
import { format, isWeekend } from "date-fns";
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

const getRequestColor = (request: WorkScheduleRequest) => {
  const baseColors = {
    telework: 'bg-blue-500',
    paid_leave: 'bg-green-500',
    unpaid_leave: 'bg-orange-500'
  };

  const statusModifiers = {
    pending: 'opacity-50 border-2 border-dashed',
    approved: 'opacity-100',
    rejected: 'opacity-30 bg-red-500'
  };

  const baseColor = baseColors[request.request_type] || 'bg-gray-500';
  const statusModifier = statusModifiers[request.status] || '';

  return `${baseColor} ${statusModifier}`;
};

const getRequestLabel = (request: WorkScheduleRequest) => {
  const labels = {
    telework: 'TT',
    paid_leave: 'CP',
    unpaid_leave: 'CSS'
  };
  
  let label = labels[request.request_type] || '?';
  
  if (request.is_exceptional) {
    label += '*';
  }
  
  return label;
};

export const WorkScheduleCalendar: React.FC<WorkScheduleCalendarProps> = ({
  calendarData,
  onDayClick,
  onRequestClick,
  isAdmin,
  userId,
  onDirectTeleworkAdd
}) => {
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const handleDayClick = (date: Date, dayRequests: WorkScheduleRequest[]) => {
    // Si c'est un weekend, ne rien faire
    if (isWeekend(date)) return;

    // Vérifier s'il y a déjà une demande de télétravail pour ce jour
    const existingTelework = dayRequests.find(r => r.request_type === 'telework');
    
    if (existingTelework) {
      // S'il y a déjà du télétravail, ouvrir le dialog pour modification
      onRequestClick(existingTelework);
    } else {
      // Sinon, ajouter directement le télétravail SANS ouvrir de dialog
      if (onDirectTeleworkAdd) {
        onDirectTeleworkAdd(date);
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
          week.days.map((day, dayIndex) => (
            <div
              key={`${weekIndex}-${dayIndex}`}
              className={cn(
                "min-h-[100px] p-2 border-r border-b last:border-r-0 cursor-pointer hover:bg-gray-50",
                !day.isCurrentMonth && "bg-gray-50 text-gray-400",
                day.isToday && "bg-blue-50 border-blue-200",
                isWeekend(day.date) && "bg-gray-100 cursor-not-allowed"
              )}
              onClick={() => handleDayClick(day.date, day.requests)}
            >
              {/* Numéro du jour */}
              <div className={cn(
                "text-sm font-medium mb-1",
                day.isToday && "text-blue-600"
              )}>
                {format(day.date, 'd')}
              </div>

              {/* Demandes du jour */}
              <div className="space-y-1">
                {day.requests.map((request) => (
                  <div
                    key={request.id}
                    className={cn(
                      "text-xs px-2 py-1 rounded text-white cursor-pointer hover:scale-105 transition-transform",
                      getRequestColor(request)
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestClick(request);
                    }}
                    title={`${request.user_name || 'Utilisateur'} - ${request.request_type} - ${request.status}`}
                  >
                    {getRequestLabel(request)}
                    {request.user_name && (
                      <div className="text-xs opacity-90 truncate">
                        {request.user_name.split(' ')[0]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
