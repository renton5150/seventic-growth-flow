
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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

  // Trouve une mission par ID pour afficher son nom dans les événements
  const findMissionName = (missionId: string) => {
    const mission = missions.find(m => m.id === missionId);
    return mission ? mission.name : missionId;
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-300";
      case "inprogress":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
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
                  className="rounded-md border pointer-events-auto"
                  modifiers={{
                    // Highlight days with events
                    hasEvents: (date) => 
                      datesWithEvents.some(
                        (eventDate) => eventDate.toDateString() === date.toDateString()
                      ),
                  }}
                  modifiersStyles={{
                    hasEvents: { 
                      fontWeight: "bold" 
                    }
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
                {isLoadingRequests ? (
                  <p className="text-muted-foreground">Chargement des événements...</p>
                ) : eventsForDate.length === 0 ? (
                  <p className="text-muted-foreground">Aucun événement à cette date</p>
                ) : (
                  <ul className="space-y-3">
                    {eventsForDate.map((event) => (
                      <li
                        key={event.id}
                        className="flex items-center p-3 border rounded-md hover:bg-accent"
                      >
                        {renderEventIcon(event.type)}
                        <div className="flex-grow">
                          <p className="font-medium">{event.title}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant="outline" className={getStatusColor(event.status)}>
                              {event.status === "completed" 
                                ? "Terminé" 
                                : event.status === "inprogress" 
                                  ? "En cours" 
                                  : "En attente"}
                            </Badge>
                            <p className="text-sm text-muted-foreground">
                              Mission: {findMissionName(event.missionId)}
                            </p>
                          </div>
                        </div>
                        <Link 
                          to={`/requests/${event.type}/${event.id}`} 
                          className="ml-2 text-blue-600 hover:underline text-sm whitespace-nowrap"
                        >
                          Voir
                        </Link>
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
