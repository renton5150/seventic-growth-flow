
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
          console.log("[useWorkSchedule] Chargement des demandes pour:", user.id);
          const requests = await workScheduleService.getRequests(user.id);
          console.log("[useWorkSchedule] Demandes chargées:", requests.length, "demandes");
          return requests;
        }
        return [];
      } catch (error) {
        console.error('Erreur lors du chargement des demandes:', error);
        toast.error("Erreur lors du chargement des demandes de télétravail");
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
        const formattedDate = format(date, 'yyyy-MM-dd');
        const dayRequests = allRequests.filter(request => {
          return request.start_date === formattedDate && request.request_type === 'telework';
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

  // Mutations avec gestion d'erreur améliorée et invalidation forcée
  const createRequestMutation = useMutation({
    mutationFn: async (requestData: Omit<WorkScheduleRequest, 'id' | 'created_at' | 'updated_at'>) => {
      console.log("[useWorkSchedule] Début création demande:", requestData);
      
      // Vérifier d'abord si une demande existe déjà pour cette date
      const existingRequest = allRequests.find(req => 
        req.start_date === requestData.start_date && 
        req.user_id === requestData.user_id &&
        req.request_type === 'telework'
      );
      
      if (existingRequest) {
        console.log("[useWorkSchedule] Demande existante trouvée, annulation");
        throw new Error("Une demande existe déjà pour cette date");
      }
      
      const result = await workScheduleService.createRequest(requestData);
      console.log("[useWorkSchedule] Demande créée avec succès:", result);
      return result;
    },
    onSuccess: async (data) => {
      console.log("[useWorkSchedule] Télétravail créé avec succès:", data);
      
      // Invalidation et refetch forcé
      await queryClient.invalidateQueries({ queryKey: ['work-schedule-requests'] });
      await refetch();
      
      toast.success("Jour de télétravail ajouté avec succès");
    },
    onError: (error: any) => {
      console.error("[useWorkSchedule] Erreur création:", error);
      if (error.message === "Une demande existe déjà pour cette date") {
        toast.error("Une demande de télétravail existe déjà pour cette date");
      } else {
        toast.error("Erreur lors de l'ajout du télétravail: " + error.message);
      }
    }
  });

  const deleteRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      console.log("[useWorkSchedule] Début suppression demande:", requestId);
      
      // Trouver la demande avant suppression pour le debug
      const requestToDelete = allRequests.find(req => req.id === requestId);
      if (requestToDelete) {
        console.log("[useWorkSchedule] Suppression de la date:", requestToDelete.start_date);
      }
      
      await workScheduleService.deleteRequest(requestId);
      console.log("[useWorkSchedule] Demande supprimée avec succès:", requestId);
      
      return requestToDelete; // Retourner l'élément supprimé pour le debug
    },
    onSuccess: async (deletedRequest) => {
      console.log("[useWorkSchedule] Télétravail supprimé avec succès:", deletedRequest);
      
      // Invalidation immédiate et forcée de tous les caches
      queryClient.removeQueries({ queryKey: ['work-schedule-requests'] });
      await queryClient.invalidateQueries({ queryKey: ['work-schedule-requests'] });
      
      // Forcer un refetch immédiat
      const newData = await refetch();
      console.log("[useWorkSchedule] Données après suppression:", newData.data?.length);
      
      toast.success("Jour de télétravail supprimé avec succès");
    },
    onError: (error: any) => {
      console.error("[useWorkSchedule] Erreur suppression:", error);
      toast.error("Erreur lors de la suppression: " + error.message);
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
