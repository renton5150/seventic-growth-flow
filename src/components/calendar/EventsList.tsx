
import React, { useEffect, useState } from "react";
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
  missions?: Mission[];
}

export const EventsList = ({
  selectedDate,
  events,
  isLoading,
  findMissionName,
  missions
}: EventsListProps) => {
  const [missionNameMap, setMissionNameMap] = useState<Record<string, string>>({});

  // Construire un map des noms de mission pour un accès rapide
  useEffect(() => {
    if (missions && missions.length > 0) {
      const map: Record<string, string> = {};
      missions.forEach(mission => {
        if (mission && mission.id) {
          map[String(mission.id)] = mission.name;
        }
      });
      setMissionNameMap(map);
      console.log("DEBUG - EventsList - Map des noms de mission créée:", map);
    }
  }, [missions]);
  
  // Log pour debug
  useEffect(() => {
    if (events.length > 0) {
      console.log("DEBUG - EventsList - Événements reçus:", events);
      events.forEach(event => {
        // Convertir missionId en chaîne si défini
        const missionId = event.missionId ? String(event.missionId) : undefined;
        
        // Rechercher le nom de la mission de plusieurs façons
        const missionNameFromMap = missionId ? missionNameMap[missionId] : undefined;
        const missionNameFromFunction = missionId ? findMissionName(missionId) : undefined;
        const missionNameFromEvent = event.missionName;
        
        console.log(`DEBUG - EventsList - Événement ${event.id}, Mission ID: ${missionId} (${typeof event.missionId})`);
        console.log(`DEBUG - EventsList - Noms de mission disponibles pour ${event.id}:`, {
          missionNameFromMap,
          missionNameFromFunction,
          missionNameFromEvent
        });
        
        // Afficher toutes les propriétés de l'événement pour voir ce qui est disponible
        console.log(`DEBUG - EventsList - Propriétés de l'événement:`, {
          id: event.id,
          title: event.title,
          type: event.type,
          missionId: event.missionId,
          missionName: event.missionName,
          status: event.status
        });
      });
    } else {
      console.log("DEBUG - EventsList - Aucun événement à afficher");
    }
  }, [events, findMissionName, missionNameMap]);

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

  // Fonction pour obtenir le meilleur nom de mission disponible
  const getBestMissionName = (event: Request): string => {
    // Si l'événement a directement un nom de mission, on l'utilise
    if (event.missionName) {
      return event.missionName;
    }
    
    // Sinon, on utilise l'ID pour chercher dans notre map local
    if (event.missionId) {
      const missionId = String(event.missionId);
      
      // Essayer d'abord notre map local
      if (missionNameMap[missionId]) {
        return missionNameMap[missionId];
      }
      
      // Sinon utiliser la fonction de recherche
      return findMissionName(missionId);
    }
    
    return "Sans mission";
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
              const missionName = getBestMissionName(event);
              console.log(`DEBUG - EventsList - Rendu de l'événement ${event.id}, Mission: ${missionName}`);
              
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
                      {event.missionId && (
                        <p className="text-sm text-muted-foreground">
                          Mission: {missionName}
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
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
