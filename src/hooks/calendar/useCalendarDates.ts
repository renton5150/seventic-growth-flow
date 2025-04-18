
import { useState, useEffect, useMemo } from "react";
import { Request } from "@/types/types";

export const useCalendarDates = (requests: Request[]) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [eventsForDate, setEventsForDate] = useState<Request[]>([]);
  
  // Memoize dates with events to avoid unnecessary recalculations
  const datesWithEvents = useMemo(() => {
    if (!requests || requests.length === 0) {
      return [];
    }
    
    return requests
      .filter(req => req.dueDate) // Ensure dueDate exists
      .map(req => new Date(req.dueDate));
  }, [requests]);

  // Update events when selected date or requests change
  useEffect(() => {
    if (selectedDate && requests.length > 0) {
      const selectedDateStr = selectedDate.toDateString();
      
      const requestsForDate = requests.filter(req => {
        const dueDate = new Date(req.dueDate);
        return dueDate.toDateString() === selectedDateStr;
      });
      
      setEventsForDate(requestsForDate);
      
      console.log(`[useCalendarDates] Found ${requestsForDate.length} events for selected date ${selectedDateStr}`);
      
      if (requestsForDate.length > 0) {
        requestsForDate.forEach(req => {
          console.log(`[useCalendarDates] Event: ${req.id}, Title: ${req.title}, Mission ID: ${req.missionId}`);
        });
      }
    } else {
      setEventsForDate([]);
    }
  }, [selectedDate, requests]);

  return {
    selectedDate,
    setSelectedDate,
    eventsForDate,
    datesWithEvents,
  };
};
