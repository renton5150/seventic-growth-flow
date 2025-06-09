
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
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRequestTypes, setSelectedRequestTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  
  const isAdmin = user?.role === "admin";

  // Récupération des demandes avec gestion d'erreur
  const { data: allRequests = [], isLoading, refetch } = useQuery({
    queryKey: ['work-schedule-requests', user?.id, isAdmin],
    queryFn: async () => {
      try {
        if (isAdmin) {
          return await workScheduleService.getRequests();
        } else if (user?.id) {
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

  // Récupération de tous les utilisateurs SDR et Growth pour les admins
  const { data: allUsers = [] } = useQuery({
    queryKey: ['work-schedule-users'],
    queryFn: async () => {
      if (!isAdmin) return [];
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, email, role')
          .in('role', ['sdr', 'growth'])
          .order('name');

        if (error) {
          console.error('Erreur lors du chargement des utilisateurs:', error);
          return [];
        }

        console.log('Utilisateurs récupérés pour admin:', data);
        return data || [];
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        return [];
      }
    },
    enabled: isAdmin
  });

  // Filtrage des demandes
  const filteredRequests = useMemo(() => {
    let filtered = allRequests;

    // Filtre par utilisateur (admin uniquement)
    if (isAdmin && selectedUserId) {
      filtered = filtered.filter(request => request.user_id === selectedUserId);
    }

    // Filtre par type de demande
    if (selectedRequestTypes.length > 0) {
      filtered = filtered.filter(request => selectedRequestTypes.includes(request.request_type));
    }

    // Filtre par statut
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(request => selectedStatuses.includes(request.status));
    }

    return filtered;
  }, [allRequests, isAdmin, selectedUserId, selectedRequestTypes, selectedStatuses]);

  // Construction du calendrier
  const calendarData = useMemo((): WorkScheduleCalendarMonth => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const weeks: WorkScheduleCalendarWeek[] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      const weekDays = allDays.slice(i, i + 7).map((date): WorkScheduleCalendarDay => {
        const dayRequests = filteredRequests.filter(request => {
          const startDate = new Date(request.start_date);
          const endDate = new Date(request.end_date);
          return date >= startDate && date <= endDate;
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
  }, [currentDate, filteredRequests]);

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
      toast.success("Demande créée avec succès");
    },
    onError: (error) => {
      toast.error("Erreur lors de la création de la demande");
      console.error(error);
    }
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<WorkScheduleRequest> }) =>
      workScheduleService.updateRequest(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-schedule-requests'] });
      toast.success("Demande mise à jour avec succès");
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour de la demande");
      console.error(error);
    }
  });

  const deleteRequestMutation = useMutation({
    mutationFn: workScheduleService.deleteRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-schedule-requests'] });
      toast.success("Demande supprimée avec succès");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression de la demande");
      console.error(error);
    }
  });

  // Utilisateurs disponibles pour les filtres (admin uniquement)
  const availableUsers = useMemo(() => {
    if (!isAdmin) return [];
    return allUsers;
  }, [allUsers, isAdmin]);

  // Format d'affichage du mois
  const monthLabel = useMemo(() => {
    return format(currentDate, 'MMMM yyyy', { locale: fr });
  }, [currentDate]);

  return {
    // Data
    calendarData,
    currentDate,
    monthLabel,
    allRequests: filteredRequests,
    availableUsers,
    isLoading,
    
    // Filters
    selectedUserId,
    selectedRequestTypes,
    selectedStatuses,
    setSelectedUserId,
    setSelectedRequestTypes,
    setSelectedStatuses,
    
    // Navigation
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    
    // Mutations
    createRequest: createRequestMutation.mutate,
    updateRequest: updateRequestMutation.mutate,
    deleteRequest: deleteRequestMutation.mutate,
    
    // States
    isCreating: createRequestMutation.isPending,
    isUpdating: updateRequestMutation.isPending,
    isDeleting: deleteRequestMutation.isPending,
    
    // Permissions
    isAdmin,
    refetch
  };
};
