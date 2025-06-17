
import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Database, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Request, Mission } from "@/types/types";

interface EventsListProps {
  selectedDate: Date | undefined;
  events: Request[];
  isLoading: boolean;
  findMissionName: (missionId: string | undefined) => Promise<string>;
  missionNameMap: Record<string, string>;
  missions: Mission[];
}

export const EventsList = ({
  selectedDate,
  events,
  isLoading,
  findMissionName,
  missionNameMap,
  missions
}: EventsListProps) => {
  // State to hold resolved mission names
  const [eventMissionNames, setEventMissionNames] = useState<Record<string, string>>({});
  
  // When events change, resolve all mission names
  useEffect(() => {
    const resolveMissionNames = async () => {
      const namesMap: Record<string, string> = {};
      
      for (const event of events) {
        if (event.missionId) {
          // Try to get name from missionNameMap first (synchronous)
          if (missionNameMap[event.missionId]) {
            namesMap[event.id] = missionNameMap[event.missionId];
          } else {
            // Fallback to async function
            namesMap[event.id] = await findMissionName(event.missionId);
          }
        } else {
          namesMap[event.id] = "Sans mission";
        }
      }
      
      setEventMissionNames(namesMap);
    };
    
    resolveMissionNames();
  }, [events, missionNameMap, findMissionName]);

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
      case "in progress":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // Function to get the best mission name
  const getMissionName = (event: Request): string => {
    // If we have resolved the name in our state, use that first
    if (eventMissionNames[event.id]) {
      return eventMissionNames[event.id];
    }
    
    // If event already has a mission name, use it
    if (event.missionName) {
      return event.missionName;
    }
    
    // If mission ID is in our map, use that
    if (event.missionId && missionNameMap[event.missionId]) {
      return missionNameMap[event.missionId];
    }
    
    // Recherche dans les missions chargées
    if (event.missionId && missions.length > 0) {
      const mission = missions.find(m => m.id === event.missionId);
      if (mission && mission.name) {
        return mission.name;
      }
    }
    
    // Default fallback
    return "Chargement...";
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-xl font-semibold mb-4">
          {selectedDate
            ? `Événements du ${selectedDate.toLocaleDateString("fr-FR")}`
            : "Sélectionnez une date"}
        </h2>
        {isLoading ? (
          <p className="text-muted-foreground">Chargement des événements...</p>
        ) : events.length === 0 ? (
          <p className="text-muted-foreground">Aucun événement à cette date</p>
        ) : (
          <ul className="space-y-3">
            {events.map((event) => {
              const missionName = getMissionName(event);
              
              return (
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
                          : event.status === "in progress"
                            ? "En cours"
                            : "En attente"}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        Mission: {missionName}
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
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
