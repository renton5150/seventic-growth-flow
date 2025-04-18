
import React, { useEffect } from "react";
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
    missions
  } = useCalendarEvents(user?.id);

  // Log de diagnostic pour vérifier les missions disponibles
  useEffect(() => {
    console.log("[DIAGNOSTIC - Calendar] Affichage des missions disponibles:");
    if (Array.isArray(missions) && missions.length > 0) {
      console.log("[DIAGNOSTIC - Calendar]", missions.length, "missions trouvées:");
      missions.forEach(mission => {
        console.log(`[DIAGNOSTIC - Calendar] Mission: ID=${mission.id}, Nom=${mission.name}`);
      });
    } else {
      console.log("[DIAGNOSTIC - Calendar] Aucune mission trouvée ou tableau vide");
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
