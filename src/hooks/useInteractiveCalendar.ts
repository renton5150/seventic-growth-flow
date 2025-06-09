
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
  
  // Filtres pour les admins
  const [selectedSdrIds, setSelectedSdrIds] = useState<string[]>([]);
  const [selectedMissionTypes, setSelectedMissionTypes] = useState<string[]>([]);

  const isAdmin = user?.role === "admin";

  // Récupération des missions (TOUTES les missions sans filtrage initial)
  const { data: allMissions = [], isLoading, refetch } = useQuery({
    queryKey: ['calendar-missions', user?.id, isAdmin],
    queryFn: async () => {
      if (isAdmin) {
        console.log("Admin: récupération de toutes les missions");
        const missions = await getAllMissions();
        console.log("Missions récupérées pour admin:", missions);
        return missions;
      } else if (user?.id) {
        console.log("SDR: récupération des missions pour", user.id);
        const missions = await getMissionsByUserId(user.id);
        console.log("Missions récupérées pour SDR:", missions);
        return missions;
      }
      return [];
    },
    enabled: !!user
  });

  // Filtrage des missions par mois actuel ET par les filtres sélectionnés
  const missions = useMemo(() => {
    console.log("Calcul des missions à afficher pour le mois:", format(currentDate, 'MMMM yyyy', { locale: fr }));
    console.log("Toutes les missions:", allMissions);
    
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    console.log("Période du mois:", {
      start: format(monthStart, 'dd/MM/yyyy'),
      end: format(monthEnd, 'dd/MM/yyyy')
    });

    // Filtrer d'abord par date (missions actives pendant le mois affiché)
    const missionsInMonth = allMissions.filter(mission => {
      // Une mission est visible si elle est active pendant le mois affiché
      if (!mission.startDate) return false;
      
      const missionStart = new Date(mission.startDate);
      const missionEnd = mission.endDate ? new Date(mission.endDate) : missionStart;
      
      // La mission est visible si :
      // - Elle commence avant ou pendant le mois ET
      // - Elle se termine après ou pendant le mois
      const isActiveInMonth = missionStart <= monthEnd && missionEnd >= monthStart;
      
      if (isActiveInMonth) {
        console.log(`Mission "${mission.name}" active pendant ${format(currentDate, 'MMMM yyyy', { locale: fr })}`);
      }
      
      return isActiveInMonth;
    });

    console.log(`${missionsInMonth.length} missions actives pendant ${format(currentDate, 'MMMM yyyy', { locale: fr })}`);

    // Pour les non-admins, on retourne les missions filtrées par mois
    if (!isAdmin) {
      return missionsInMonth;
    }

    // Pour les admins, on applique également les filtres SDR et type
    let filteredMissions = missionsInMonth;

    // Filtre par SDR
    if (selectedSdrIds.length > 0) {
      filteredMissions = filteredMissions.filter(mission => 
        mission.sdrId && selectedSdrIds.includes(mission.sdrId)
      );
      console.log(`Après filtre SDR: ${filteredMissions.length} missions`);
    }

    // Filtre par type de mission
    if (selectedMissionTypes.length > 0) {
      filteredMissions = filteredMissions.filter(mission => 
        selectedMissionTypes.includes(mission.type)
      );
      console.log(`Après filtre type: ${filteredMissions.length} missions`);
    }

    return filteredMissions;
  }, [allMissions, isAdmin, currentDate, selectedSdrIds, selectedMissionTypes]);

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

      await updateSupaMission(updatedMission);
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

  // Récupération des SDRs uniques pour les filtres (admin uniquement) - basé sur TOUTES les missions, pas seulement celles du mois
  const availableSdrs = useMemo(() => {
    if (!isAdmin) return [];
    
    console.log("Calcul des SDRs disponibles à partir de:", allMissions);
    
    const sdrMap = new Map();
    allMissions.forEach(mission => {
      if (mission.sdrId && mission.sdrName) {
        sdrMap.set(mission.sdrId, mission.sdrName);
      }
    });
    
    const sdrs = Array.from(sdrMap.entries()).map(([id, name]) => ({ id, name }));
    console.log("SDRs disponibles:", sdrs);
    return sdrs;
  }, [allMissions, isAdmin]);

  // Types de mission disponibles - basé sur TOUTES les missions
  const availableMissionTypes = useMemo(() => {
    const types = Array.from(new Set(allMissions.map(mission => mission.type)));
    console.log("Types de mission disponibles:", types);
    return types;
  }, [allMissions]);

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
    // Filtres
    selectedSdrIds,
    selectedMissionTypes,
    availableSdrs,
    availableMissionTypes,
    setSelectedSdrIds,
    setSelectedMissionTypes,
    // Actions
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
    refetch,
    // Permissions
    isAdmin
  };
};
