
import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Database, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Request, Mission } from "@/types/types";

interface EventsListProps {
  selectedDate: Date | undefined;
  events: Request[];
  isLoading: boolean;
  findMissionName: (missionId: string | undefined) => string;
  missions: Mission[];
}

export const EventsList = ({
  selectedDate,
  events,
  isLoading,
  findMissionName,
  missions
}: EventsListProps) => {
  // Create a memoized map for quick mission name lookups
  const missionNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    
    // Add all missions to the map
    if (missions && missions.length > 0) {
      missions.forEach(mission => {
        if (mission && mission.id) {
          const missionId = String(mission.id);
          map[missionId] = mission.name;
        }
      });
    }
    
    // Add known mission IDs manually
    map["124ea847-cf3f-44af-becb-75641ebf0ef1"] = "Datalit";
    map["bdb6b562-f9ef-49cd-b035-b48d7df054e8"] = "Seventic";
    
    return map;
  }, [missions]);

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

  // Function to get the best mission name using multiple strategies
  const getMissionName = (event: Request): string => {
    // Strategy 1: Use missionName property if available
    if (event.missionName) {
      return event.missionName;
    }
    
    // Strategy 2: Use our mission map for quick lookup
    if (event.missionId) {
      const idStr = String(event.missionId);
      if (missionNameMap[idStr]) {
        return missionNameMap[idStr];
      }
    }
    
    // Strategy 3: Use the provided findMissionName function
    return findMissionName(event.missionId);
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
                          : event.status === "inprogress"
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
};
