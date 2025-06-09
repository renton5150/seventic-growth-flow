
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
      console.log("🔄 [useWorkScheduleNew] Chargement des demandes pour:", user.id);
      const requests = await workScheduleNewService.getTeleworkRequests(user.id);
      console.log("📋 [useWorkScheduleNew] Demandes chargées:", requests.length);
      return requests;
    },
    enabled: !!user?.id
  });

  // Extraction des dates de télétravail
  const teleworkDates = useMemo(() => {
    const dates = teleworkRequests.map(request => request.start_date);
    console.log("📅 [useWorkScheduleNew] Dates télétravail:", dates);
    return dates;
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

  // Force refresh avec invalidation immédiate
  const forceRefresh = async () => {
    console.log("🔄 [useWorkScheduleNew] Force refresh complet");
    
    // Invalider immédiatement le cache
    await queryClient.invalidateQueries({ queryKey: ['telework-requests-new'] });
    
    // Incrémenter la clé de refresh
    setRefreshKey(prev => prev + 1);
    
    // Forcer un refetch
    await refetch();
  };

  // Mutation pour ajouter un jour de télétravail
  const addTeleworkMutation = useMutation({
    mutationFn: async (date: Date) => {
      if (!user?.id) throw new Error("Utilisateur non connecté");
      const dateString = format(date, 'yyyy-MM-dd');
      console.log("➕ [useWorkScheduleNew] Début ajout pour:", dateString);
      
      const result = await workScheduleNewService.addTeleworkDay(user.id, date);
      console.log("✅ [useWorkScheduleNew] Résultat ajout:", result);
      return result;
    },
    onSuccess: async (result) => {
      console.log("✅ [useWorkScheduleNew] Télétravail ajouté avec succès:", result);
      
      // Refresh immédiat et complet
      await forceRefresh();
      
      toast.success("Jour de télétravail ajouté avec succès");
    },
    onError: (error: any) => {
      console.error("❌ [useWorkScheduleNew] Erreur ajout:", error);
      toast.error(error.message || "Erreur lors de l'ajout du télétravail");
    }
  });

  // Mutation pour supprimer un jour de télétravail avec traces détaillées
  const removeTeleworkMutation = useMutation({
    mutationFn: async (date: Date) => {
      if (!user?.id) throw new Error("Utilisateur non connecté");
      const dateString = format(date, 'yyyy-MM-dd');
      console.log("🗑️ [useWorkScheduleNew] Début suppression pour:", dateString);
      
      // Vérifier que la date existe avant suppression
      const existsBefore = teleworkDates.includes(dateString);
      console.log("🔍 [useWorkScheduleNew] Date existe avant suppression:", existsBefore);
      
      if (!existsBefore) {
        console.log("⚠️ [useWorkScheduleNew] Date non trouvée, annulation");
        throw new Error("Ce jour n'est pas en télétravail");
      }
      
      const result = await workScheduleNewService.removeTeleworkDay(user.id, date);
      console.log("✅ [useWorkScheduleNew] Résultat suppression:", result);
      
      return result;
    },
    onSuccess: async (result) => {
      console.log("✅ [useWorkScheduleNew] Télétravail supprimé avec succès:", result);
      
      // Refresh immédiat et complet
      await forceRefresh();
      
      toast.success("Jour de télétravail supprimé avec succès");
    },
    onError: (error: any) => {
      console.error("❌ [useWorkScheduleNew] Erreur suppression:", error);
      toast.error(error.message || "Erreur lors de la suppression du télétravail");
      
      // En cas d'erreur, forcer quand même un refresh pour s'assurer de la cohérence
      forceRefresh();
    }
  });

  // Mutation pour réinitialiser complètement
  const resetTeleworkMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Utilisateur non connecté");
      console.log("🔄 [useWorkScheduleNew] Début réinitialisation");
      
      const result = await workScheduleNewService.resetAllTelework(user.id);
      console.log("✅ [useWorkScheduleNew] Résultat réinitialisation:", result);
      return result;
    },
    onSuccess: async (result) => {
      console.log("✅ [useWorkScheduleNew] Calendrier réinitialisé:", result);
      
      // Refresh immédiat et complet
      await forceRefresh();
      
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
