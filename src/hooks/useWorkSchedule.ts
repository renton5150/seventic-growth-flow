
import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { WorkScheduleRequest, WorkScheduleCalendarMonth, WorkScheduleCalendarWeek, WorkScheduleCalendarDay } from "@/types/workSchedule";
import { workScheduleService } from "@/services/workScheduleService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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

export const useWorkSchedule = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const isAdmin = user?.role === "admin";

  // Récupération des demandes avec gestion d'erreur
  const { data: allRequests = [], isLoading, refetch } = useQuery({
    queryKey: ['work-schedule-requests', user?.id],
    queryFn: async () => {
      try {
        if (user?.id) {
          return await workScheduleService.getRequests(user.id);
        }
        return [];
      } catch (error) {
        console.error('Erreur lors du chargement des demandes:', error);
        return [];
      }
    },
    enabled: !!user
  });

  // Récupération de tous les utilisateurs SDR et Growth pour les admins (simplifié)
  const { data: allUsers = [] } = useQuery({
    queryKey: ['work-schedule-users'],
    queryFn: async () => [],
    enabled: false // Désactivé pour l'instant
  });

  // Construction du calendrier (simplifié pour télétravail uniquement)
  const calendarData = useMemo((): WorkScheduleCalendarMonth => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const weeks: WorkScheduleCalendarWeek[] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      const weekDays = allDays.slice(i, i + 7).map((date): WorkScheduleCalendarDay => {
        const dayRequests = allRequests.filter(request => {
          const startDate = new Date(request.start_date);
          const endDate = new Date(request.end_date);
          return date >= startDate && date <= endDate && request.request_type === 'telework';
        });

        return {
          date,
          isCurrentMonth: isSameMonth(date, currentDate),
          isWeekend: isWeekend(date),
          requests: dayRequests,
          isToday: isToday(date)
        };
      });

      weeks.push({ days: weekDays });
    }

    return { weeks, currentDate };
  }, [currentDate, allRequests]);

  // Navigation du calendrier
  const goToPreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Mutations avec gestion d'erreur
  const createRequestMutation = useMutation({
    mutationFn: workScheduleService.createRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-schedule-requests'] });
      toast.success("Jour de télétravail ajouté");
    },
    onError: (error) => {
      toast.error("Erreur lors de l'ajout du télétravail");
      console.error(error);
    }
  });

  const deleteRequestMutation = useMutation({
    mutationFn: workScheduleService.deleteRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-schedule-requests'] });
      toast.success("Jour de télétravail supprimé");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    }
  });

  // Format d'affichage du mois
  const monthLabel = useMemo(() => {
    return format(currentDate, 'MMMM yyyy', { locale: fr });
  }, [currentDate]);

  return {
    // Data
    calendarData,
    currentDate,
    monthLabel,
    allRequests,
    availableUsers: [],
    isLoading,
    
    // Filters (simplifiés)
    selectedUserId: '',
    selectedRequestTypes: ['telework'],
    selectedStatuses: ['approved'],
    setSelectedUserId: () => {},
    setSelectedRequestTypes: () => {},
    setSelectedStatuses: () => {},
    
    // Navigation
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    
    // Mutations
    createRequest: createRequestMutation.mutate,
    updateRequest: () => {},
    deleteRequest: deleteRequestMutation.mutate,
    
    // States
    isCreating: createRequestMutation.isPending,
    isUpdating: false,
    isDeleting: deleteRequestMutation.isPending,
    
    // Permissions
    isAdmin,
    refetch
  };
};
