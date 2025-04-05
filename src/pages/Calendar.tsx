
import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Database, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllRequests } from "@/services/requestService";
import { getAllMissions } from "@/services/missionService";
import { Request } from "@/types/types";
import { useQuery } from "@tanstack/react-query";

const Calendar = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [eventsForDate, setEventsForDate] = useState<any[]>([]);
  const [datesWithEvents, setDatesWithEvents] = useState<Date[]>([]);

  // Fetch requests and missions data
  const { data: requests = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: ['calendar-requests'],
    queryFn: getAllRequests,
    enabled: !!user
  });

  const { data: missions = [], isLoading: isLoadingMissions } = useQuery({
    queryKey: ['calendar-missions'],
    queryFn: getAllMissions,
    enabled: !!user
  });

  // Calculate dates with events when data is loaded
  useEffect(() => {
    if (requests.length > 0) {
      // Get all due dates from requests
      const eventDates = requests.map(req => new Date(req.dueDate));
      setDatesWithEvents(eventDates);
    }
  }, [requests]);

  // Calculate events for selected date
  useEffect(() => {
    if (selectedDate && requests.length > 0) {
      const selectedDateStr = selectedDate.toDateString();
      
      // Filter requests for selected date
      const requestsForDate = requests.filter(req => {
        return new Date(req.dueDate).toDateString() === selectedDateStr;
      });
      
      setEventsForDate(requestsForDate);
    }
  }, [selectedDate, requests]);

  const renderEventIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail size={16} className="mr-2" />;
      case "database":
        return <Database size={16} className="mr-2" />;
      case "linkedin":
        return <User size={16} className="mr-2" />;
      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Calendrier</h1>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/2">
            <Card>
              <CardContent className="pt-6">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                  modifiers={{
                    // Highlight days with events
                    hasEvents: (date) => 
                      datesWithEvents.some(
                        (eventDate) => eventDate.toDateString() === date.toDateString()
                      ),
                  }}
                  modifiersClassNames={{
                    hasEvents: "bg-seventic-50 font-bold",
                  }}
                />
              </CardContent>
            </Card>
          </div>
          <div className="lg:w-1/2">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">
                  {selectedDate
                    ? `Événements du ${selectedDate.toLocaleDateString("fr-FR")}`
                    : "Sélectionnez une date"}
                </h2>
                {eventsForDate.length === 0 ? (
                  <p className="text-muted-foreground">Aucun événement à cette date</p>
                ) : (
                  <ul className="space-y-3">
                    {eventsForDate.map((event) => (
                      <li
                        key={event.id}
                        className="flex items-center p-3 border rounded-md hover:bg-accent"
                      >
                        {renderEventIcon(event.type)}
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{event.status}</Badge>
                            <p className="text-sm text-muted-foreground">
                              Mission: {event.missionId}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Calendar;
