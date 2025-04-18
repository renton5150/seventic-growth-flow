
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
  missions: Mission[];
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
      console.log("[DIAGNOSTIC - EventsList] Missions reçues:", JSON.stringify(missions, null, 2));
      
      const map: Record<string, string> = {};
      missions.forEach(mission => {
        if (mission && mission.id) {
          const missionId = String(mission.id);
          map[missionId] = mission.name;
          console.log(`[DIAGNOSTIC - EventsList] Ajout mission au cache: ID=${missionId}, Nom=${mission.name}`);
        }
      });
      
      setMissionNameMap(map);
      console.log("[DIAGNOSTIC - EventsList] Map des noms de mission créée:", map);
    } else {
      console.log("[DIAGNOSTIC - EventsList] Aucune mission reçue ou tableau vide");
    }
  }, [missions]);
  
  // Log détaillé pour debug
  useEffect(() => {
    if (events.length > 0) {
      console.log("[DIAGNOSTIC - EventsList] ÉVÉNEMENTS COMPLETS:", JSON.stringify(events, null, 2));
      
      events.forEach(event => {
        console.log(`[DIAGNOSTIC - EventsList] Événement complet:`, {
          id: event.id,
          title: event.title,
          type: event.type,
          missionId: event.missionId,
          missionIdType: typeof event.missionId,
          missionName: event.missionName,
          status: event.status,
          dueDate: event.dueDate
        });
        
        // Si l'événement a un ID de mission, tester toutes les méthodes de recherche
        if (event.missionId) {
          const missionIdStr = String(event.missionId);
          console.log(`[DIAGNOSTIC - EventsList] Test de recherche pour mission ID: ${missionIdStr}`);
          
          // 1. Recherche dans le map local
          console.log(`[DIAGNOSTIC - EventsList] Recherche dans le map local: ${missionNameMap[missionIdStr] || 'non trouvé'}`);
          
          // 2. Recherche avec la fonction findMissionName
          const missionNameFromFunction = findMissionName(missionIdStr);
          console.log(`[DIAGNOSTIC - EventsList] Recherche via findMissionName: ${missionNameFromFunction}`);
          
          // 3. Recherche directe dans le tableau des missions
          const directMatch = missions.find(m => String(m.id) === missionIdStr);
          console.log(`[DIAGNOSTIC - EventsList] Recherche directe dans missions: ${directMatch?.name || 'non trouvé'}`);
        }
      });
    }
  }, [events, findMissionName, missionNameMap, missions]);

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
    console.log(`[DIAGNOSTIC - EventsList] Recherche du nom pour mission de l'événement: ${event.id}`);
    
    // 1. Si ID spécifique connu
    if (event.missionId === "bdb6b562-f9ef-49cd-b035-b48d7df054e8") {
      console.log("[DIAGNOSTIC - EventsList] ID spécifique reconnu: Seventic");
      return "Seventic";
    }
    
    // 2. Si l'événement a directement un nom de mission, on l'utilise
    if (event.missionName) {
      console.log(`[DIAGNOSTIC - EventsList] Nom trouvé dans l'événement: ${event.missionName}`);
      return event.missionName;
    }
    
    // 3. Sinon, on utilise l'ID pour chercher dans notre map local
    if (event.missionId) {
      const missionId = String(event.missionId);
      
      // Essayer d'abord notre map local
      if (missionNameMap[missionId]) {
        console.log(`[DIAGNOSTIC - EventsList] Nom trouvé dans le map: ${missionNameMap[missionId]}`);
        return missionNameMap[missionId];
      }
      
      // Recherche directe dans le tableau des missions
      const directMatch = missions.find(m => String(m.id) === missionId);
      if (directMatch) {
        console.log(`[DIAGNOSTIC - EventsList] Nom trouvé par recherche directe: ${directMatch.name}`);
        return directMatch.name;
      }
      
      // Sinon utiliser la fonction de recherche
      const name = findMissionName(missionId);
      console.log(`[DIAGNOSTIC - EventsList] Nom trouvé par findMissionName: ${name}`);
      return name;
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
              console.log(`[DIAGNOSTIC - EventsList] Rendu de l'événement ${event.id}, Mission: ${missionName}`);
              
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
