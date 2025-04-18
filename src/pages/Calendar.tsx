
import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { CalendarCard } from "@/components/calendar/CalendarCard";
import { EventsList } from "@/components/calendar/EventsList";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";

const Calendar = () => {
  const { user } = useAuth();
  const {
    selectedDate,
    setSelectedDate,
    eventsForDate,
    datesWithEvents,
    findMissionName,
    isLoadingRequests,
    missions,
    missionNameMap
  } = useCalendarEvents(user?.id);

  // Log missions for debugging
  React.useEffect(() => {
    if (missions) {
      console.log(`Calendar page - Missions loaded: ${missions.length}`);
      missions.forEach(m => console.log(`Mission: ${m.id} - ${m.name}`));
    }
  }, [missions]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Calendrier</h1>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/2">
            <CalendarCard
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              datesWithEvents={datesWithEvents}
            />
          </div>
          <div className="lg:w-1/2">
            <EventsList
              selectedDate={selectedDate}
              events={eventsForDate}
              isLoading={isLoadingRequests}
              findMissionName={findMissionName}
              missions={missions || []}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Calendar;
