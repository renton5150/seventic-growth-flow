
import { useQuery } from "@tanstack/react-query";
import { getAllRequests } from "@/services/requestService";
import { useCalendarDates } from "./calendar/useCalendarDates";
import { useMissionData } from "./calendar/useMissionData";
import { useMissionNameUtils } from "./calendar/useMissionNames";

export const useCalendarEvents = (userId: string | undefined) => {
  // Récupérer toutes les requêtes
  const { data: requests = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: ['calendar-requests'],
    queryFn: getAllRequests,
    enabled: !!userId
  });

  // Utiliser les hooks séparés
  const { missions } = useMissionData(userId);
  const { selectedDate, setSelectedDate, eventsForDate, datesWithEvents } = useCalendarDates(requests);
  const { findMissionName } = useMissionNameUtils(missions);

  return {
    selectedDate,
    setSelectedDate,
    eventsForDate,
    datesWithEvents,
    findMissionName,
    isLoadingRequests,
    missions
  };
};
