
import { useState, useEffect } from "react";
import { Request } from "@/types/types";

export const useCalendarDates = (requests: Request[]) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [eventsForDate, setEventsForDate] = useState<Request[]>([]);
  const [datesWithEvents, setDatesWithEvents] = useState<Date[]>([]);

  useEffect(() => {
    if (requests.length > 0) {
      const eventDates = requests.map(req => new Date(req.dueDate));
      setDatesWithEvents(eventDates);
      console.log(`[DIAGNOSTIC] ${requests.length} requêtes reçues, ${eventDates.length} dates avec événements`);
    }
  }, [requests]);

  useEffect(() => {
    if (selectedDate && requests.length > 0) {
      const selectedDateStr = selectedDate.toDateString();
      const requestsForDate = requests.filter(req => {
        return new Date(req.dueDate).toDateString() === selectedDateStr;
      });
      setEventsForDate(requestsForDate);
      
      console.log(`[DIAGNOSTIC] ${requestsForDate.length} événements pour la date sélectionnée`);
      if (requestsForDate.length > 0) {
        console.log("[DIAGNOSTIC] ÉVÉNEMENTS DU JOUR (DONNÉES BRUTES):", JSON.stringify(requestsForDate, null, 2));
        
        requestsForDate.forEach(req => {
          console.log(`[DIAGNOSTIC] Requête ${req.id}, Type: ${req.type}, Mission ID: ${req.missionId} (${typeof req.missionId}), Mission Name: ${req.missionName || 'non défini'}`);
        });
      }
    }
  }, [selectedDate, requests]);

  return {
    selectedDate,
    setSelectedDate,
    eventsForDate,
    datesWithEvents,
  };
};
