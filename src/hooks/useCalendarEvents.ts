
import { useQuery } from "@tanstack/react-query";
import { getAllRequests } from "@/services/requestService";
import { useCalendarDates } from "./calendar/useCalendarDates";
import { useMissionData } from "./calendar/useMissionData";
import { useMissionNameUtils } from "./calendar/useMissionNames";

export const useCalendarEvents = (userId: string | undefined) => {
  // Fetch all requests
  const { data: requests = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: ['calendar-requests'],
    queryFn: getAllRequests,
    enabled: true, // Always fetch requests for calendar
    staleTime: 60000 // Cache for 1 minute
  });

  // Use our separate hooks for different concerns
  const { missions, isLoadingMissions } = useMissionData(userId);
  const { selectedDate, setSelectedDate, eventsForDate, datesWithEvents } = useCalendarDates(requests);
  const { findMissionName, missionNameMap } = useMissionNameUtils(missions || []);

  return {
    selectedDate,
    setSelectedDate,
    eventsForDate,
    datesWithEvents,
    findMissionName,
    isLoadingRequests,
    missions,
    isLoadingMissions,
    missionNameMap
  };
};
