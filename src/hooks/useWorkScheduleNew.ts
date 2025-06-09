
import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { workScheduleNewService } from "@/services/workScheduleNewService";
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
  addMonths,
  subMonths,
  format,
  isSameWeek
} from "date-fns";
import { fr } from "date-fns/locale";

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

export const useWorkScheduleNew = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  // Récupération des demandes de télétravail
  const { data: teleworkRequests = [], isLoading, refetch } = useQuery({
    queryKey: ['telework-requests-new', user?.id, refreshKey],
    queryFn: async () => {
      if (!user?.id) return [];
      return await workScheduleNewService.getTeleworkRequests(user.id);
    },
    enabled: !!user?.id
  });

  // Extraction des dates de télétravail
  const teleworkDates = useMemo(() => {
    return teleworkRequests.map(request => request.start_date);
  }, [teleworkRequests]);

  // Construction du calendrier
  const calendarData = useMemo((): CalendarData => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const weeks: CalendarWeek[] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      const weekDays = allDays.slice(i, i + 7).map((date): CalendarDay => {
        const formattedDate = format(date, 'yyyy-MM-dd');
        const hasTelework = teleworkDates.includes(formattedDate);

        return {
          date,
          isCurrentMonth: isSameMonth(date, currentDate),
          isWeekend: isWeekend(date),
          isToday: isToday(date),
          hasTelework
        };
      });

      weeks.push({ days: weekDays });
    }

    return { weeks, currentDate };
  }, [currentDate, teleworkDates]);

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

  // Force refresh
  const forceRefresh = () => {
    console.log("🔄 [useWorkScheduleNew] Force refresh");
    setRefreshKey(prev => prev + 1);
  };

  // Mutation pour ajouter un jour de télétravail
  const addTeleworkMutation = useMutation({
    mutationFn: async (date: Date) => {
      if (!user?.id) throw new Error("Utilisateur non connecté");
      return await workScheduleNewService.addTeleworkDay(user.id, date);
    },
    onSuccess: async (result) => {
      console.log("✅ [useWorkScheduleNew] Télétravail ajouté:", result);
      
      // Force refresh immédiat
      forceRefresh();
      
      // Invalidation du cache
      await queryClient.invalidateQueries({ queryKey: ['telework-requests-new'] });
      
      toast.success("Jour de télétravail ajouté avec succès");
    },
    onError: (error: any) => {
      console.error("❌ [useWorkScheduleNew] Erreur ajout:", error);
      toast.error(error.message || "Erreur lors de l'ajout du télétravail");
    }
  });

  // Mutation pour supprimer un jour de télétravail
  const removeTeleworkMutation = useMutation({
    mutationFn: async (date: Date) => {
      if (!user?.id) throw new Error("Utilisateur non connecté");
      return await workScheduleNewService.removeTeleworkDay(user.id, date);
    },
    onSuccess: async (result) => {
      console.log("✅ [useWorkScheduleNew] Télétravail supprimé:", result);
      
      // Force refresh immédiat
      forceRefresh();
      
      // Invalidation du cache
      await queryClient.invalidateQueries({ queryKey: ['telework-requests-new'] });
      
      toast.success("Jour de télétravail supprimé avec succès");
    },
    onError: (error: any) => {
      console.error("❌ [useWorkScheduleNew] Erreur suppression:", error);
      toast.error(error.message || "Erreur lors de la suppression du télétravail");
    }
  });

  // Mutation pour réinitialiser complètement
  const resetTeleworkMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Utilisateur non connecté");
      return await workScheduleNewService.resetAllTelework(user.id);
    },
    onSuccess: async (result) => {
      console.log("✅ [useWorkScheduleNew] Calendrier réinitialisé:", result);
      
      // Force refresh immédiat
      forceRefresh();
      
      // Invalidation du cache
      await queryClient.invalidateQueries({ queryKey: ['telework-requests-new'] });
      
      toast.success("Calendrier de télétravail réinitialisé avec succès");
    },
    onError: (error: any) => {
      console.error("❌ [useWorkScheduleNew] Erreur réinitialisation:", error);
      toast.error(error.message || "Erreur lors de la réinitialisation");
    }
  });

  // Vérifier si on peut ajouter du télétravail (max 2 jours par semaine)
  const canAddTelework = (date: Date): boolean => {
    if (isWeekend(date)) return false;
    
    const teleworkThisWeek = calendarData.weeks
      .flatMap(week => week.days)
      .filter(day => 
        isSameWeek(day.date, date, { weekStartsOn: 1 }) &&
        day.hasTelework
      ).length;
    
    return teleworkThisWeek < 2;
  };

  // Format d'affichage du mois
  const monthLabel = useMemo(() => {
    return format(currentDate, 'MMMM yyyy', { locale: fr });
  }, [currentDate]);

  return {
    // Data
    calendarData,
    teleworkDates,
    monthLabel,
    isLoading,
    
    // Navigation
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    
    // Actions
    addTelework: addTeleworkMutation.mutate,
    removeTelework: removeTeleworkMutation.mutate,
    resetTelework: resetTeleworkMutation.mutate,
    
    // Utilities
    canAddTelework,
    forceRefresh,
    
    // States
    isAdding: addTeleworkMutation.isPending,
    isRemoving: removeTeleworkMutation.isPending,
    isResetting: resetTeleworkMutation.isPending,
    
    // User info
    isAdmin: user?.role === 'admin',
    userId: user?.id || ''
  };
};
