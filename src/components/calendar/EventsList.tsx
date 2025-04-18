
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Database, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Request } from "@/types/types";

interface EventsListProps {
  selectedDate: Date | undefined;
  events: Request[];
  isLoading: boolean;
  findMissionName: (missionId: string) => string;
}

export const EventsList = ({
  selectedDate,
  events,
  isLoading,
  findMissionName
}: EventsListProps) => {
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
            {events.map((event) => (
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
                    {event.missionId && (
                      <p className="text-sm text-muted-foreground">
                        Mission: {findMissionName(event.missionId)}
                      </p>
                    )}
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
  );
};
