
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllRequests } from "@/services/requestService";
import { getAllSupaMissions } from "@/services/missions";
import { Request, Mission } from "@/types/types";

export const useCalendarEvents = (userId: string | undefined) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [eventsForDate, setEventsForDate] = useState<Request[]>([]);
  const [datesWithEvents, setDatesWithEvents] = useState<Date[]>([]);
  const [missionNames, setMissionNames] = useState<Record<string, string>>({});

  const { data: requests = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: ['calendar-requests'],
    queryFn: getAllRequests,
    enabled: !!userId
  });

  const { data: missions = [], isLoading: isLoadingMissions } = useQuery<Mission[]>({
    queryKey: ['calendar-missions'],
    queryFn: getAllSupaMissions,
    enabled: !!userId
  });

  useEffect(() => {
    if (missions && missions.length > 0) {
      const missionMap: Record<string, string> = {};
      missions.forEach(mission => {
        missionMap[mission.id] = mission.name;
      });
      setMissionNames(missionMap);
    }
  }, [missions]);

  useEffect(() => {
    if (requests.length > 0) {
      const eventDates = requests.map(req => new Date(req.dueDate));
      setDatesWithEvents(eventDates);
    }
  }, [requests]);

  useEffect(() => {
    if (selectedDate && requests.length > 0) {
      const selectedDateStr = selectedDate.toDateString();
      const requestsForDate = requests.filter(req => {
        return new Date(req.dueDate).toDateString() === selectedDateStr;
      });
      setEventsForDate(requestsForDate);
    }
  }, [selectedDate, requests]);

  const findMissionName = (missionId: string) => {
    if (!missionId) return "Sans mission";
    
    if (missionNames[missionId]) {
      return missionNames[missionId];
    }
    
    const mission = missions && missions.find(m => m.id === missionId);
    
    if (mission) {
      setMissionNames(prev => ({...prev, [missionId]: mission.name}));
      return mission.name;
    }
    
    if (missionId === "mission1" || missionId === "mission2" || missionId === "mission3") {
      return "Seventic";
    }
    
    return "Mission inconnue";
  };

  return {
    selectedDate,
    setSelectedDate,
    eventsForDate,
    datesWithEvents,
    findMissionName,
    isLoadingRequests
  };
};
