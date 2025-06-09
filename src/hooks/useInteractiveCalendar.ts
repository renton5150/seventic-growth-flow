
import { useState, useEffect, useCallback, useMemo } from "react";
import { Mission } from "@/types/types";
import { CalendarDay, CalendarWeek, CalendarMonth, DraggedMission } from "@/types/calendar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllMissions, getMissionsByUserId } from "@/services/missionService";
import { updateSupaMission } from "@/services/missions/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isWeekend, 
  isToday,
  isSameDay,
  addMonths,
  subMonths,
  format
} from "date-fns";
import { fr } from "date-fns/locale";

export const useInteractiveCalendar = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [draggedMission, setDraggedMission] = useState<DraggedMission | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

  const isAdmin = user?.role === "admin";

  // Récupération des missions
  const { data: missions = [], isLoading, refetch } = useQuery({
    queryKey: ['calendar-missions', user?.id, isAdmin],
    queryFn: async () => {
      if (isAdmin) {
        return await getAllMissions();
      } else if (user?.id) {
        return await getMissionsByUserId(user.id);
      }
      return [];
    },
    enabled: !!user
  });

  // Construction du calendrier mensuel
  const calendarData = useMemo((): CalendarMonth => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const weeks: CalendarWeek[] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      const weekDays = allDays.slice(i, i + 7).map((date): CalendarDay => {
        const dayMissions = missions.filter(mission => {
          if (mission.startDate && isSameDay(new Date(mission.startDate), date)) {
            return true;
          }
          if (mission.startDate && mission.endDate) {
            const start = new Date(mission.startDate);
            const end = new Date(mission.endDate);
            return date >= start && date <= end;
          }
          return false;
        });

        return {
          date,
          isCurrentMonth: isSameMonth(date, currentDate),
          isWeekend: isWeekend(date),
          missions: dayMissions,
          isToday: isToday(date)
        };
      });

      weeks.push({ days: weekDays });
    }

    return { weeks, currentDate };
  }, [currentDate, missions]);

  // Navigation du calendrier
  const goToPreviousMonth = useCallback(() => {
    setCurrentDate(prev => subMonths(prev, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentDate(prev => addMonths(prev, 1));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Gestion du drag & drop
  const handleDragStart = useCallback((mission: Mission, sourceDate: Date) => {
    setDraggedMission({ mission, sourceDate });
  }, []);

  const handleDragEnd = useCallback(async (targetDate: Date | null) => {
    if (!draggedMission || !targetDate) {
      setDraggedMission(null);
      return;
    }

    try {
      const updatedMission = {
        ...draggedMission.mission,
        startDate: targetDate,
        // Si c'est une mission avec une durée, calculer la nouvelle end date
        endDate: draggedMission.mission.endDate ? 
          new Date(targetDate.getTime() + (new Date(draggedMission.mission.endDate).getTime() - new Date(draggedMission.mission.startDate!).getTime())) :
          null
      };

      await updateSupaMission(draggedMission.mission.id, updatedMission);
      await refetch();
      
      toast.success(`Mission "${draggedMission.mission.name}" déplacée avec succès`);
    } catch (error) {
      console.error("Erreur lors du déplacement de la mission:", error);
      toast.error("Erreur lors du déplacement de la mission");
    } finally {
      setDraggedMission(null);
    }
  }, [draggedMission, refetch]);

  // Gestion de l'édition
  const handleMissionClick = useCallback((mission: Mission) => {
    setSelectedMission(mission);
    setIsEditDialogOpen(true);
  }, []);

  const handleCreateMission = useCallback((date: Date) => {
    setSelectedDate(date);
    setSelectedMission(null);
    setIsEditDialogOpen(true);
  }, []);

  // Couleurs pour les types de mission
  const getMissionColor = useCallback((mission: Mission) => {
    const colors = {
      'Full': {
        background: 'bg-blue-500',
        border: 'border-blue-600',
        text: 'text-white'
      },
      'Part': {
        background: 'bg-purple-500',
        border: 'border-purple-600',
        text: 'text-white'
      },
      default: {
        background: 'bg-gray-500',
        border: 'border-gray-600',
        text: 'text-white'
      }
    };

    return colors[mission.type as keyof typeof colors] || colors.default;
  }, []);

  // Format d'affichage du mois
  const monthLabel = useMemo(() => {
    return format(currentDate, 'MMMM yyyy', { locale: fr });
  }, [currentDate]);

  return {
    calendarData,
    currentDate,
    selectedDate,
    selectedMission,
    isEditDialogOpen,
    isLoading,
    monthLabel,
    draggedMission,
    missions,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    handleDragStart,
    handleDragEnd,
    handleMissionClick,
    handleCreateMission,
    setIsEditDialogOpen,
    setSelectedMission,
    getMissionColor,
    refetch
  };
};
