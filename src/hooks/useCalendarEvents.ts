
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllRequests } from "@/services/requestService";
import { getAllSupaMissions } from "@/services/missions";
import { Request, Mission } from "@/types/types";

export const useCalendarEvents = (userId: string | undefined) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [eventsForDate, setEventsForDate] = useState<Request[]>([]);
  const [datesWithEvents, setDatesWithEvents] = useState<Date[]>([]);
  const [missionNames, setMissionNames] = useState<Record<string, string>>({});

  // Récupérer toutes les requêtes
  const { data: requests = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: ['calendar-requests'],
    queryFn: getAllRequests,
    enabled: !!userId
  });

  // Récupérer toutes les missions depuis Supabase
  const { data: missions = [], isLoading: isLoadingMissions } = useQuery<Mission[]>({
    queryKey: ['calendar-missions'],
    queryFn: getAllSupaMissions,
    enabled: !!userId
  });

  // Construire un map des noms de mission à partir des données récupérées
  useEffect(() => {
    if (missions && missions.length > 0) {
      console.log("Missions récupérées pour le calendrier:", missions);
      const missionMap: Record<string, string> = {};
      missions.forEach(mission => {
        if (mission && mission.id) {
          missionMap[mission.id] = mission.name || "Mission sans nom";
        }
      });
      setMissionNames(missionMap);
      console.log("Mission map créée:", missionMap);
    }
  }, [missions]);

  // Définir les dates avec des événements
  useEffect(() => {
    if (requests.length > 0) {
      const eventDates = requests.map(req => new Date(req.dueDate));
      setDatesWithEvents(eventDates);
    }
  }, [requests]);

  // Filtrer les événements pour la date sélectionnée
  useEffect(() => {
    if (selectedDate && requests.length > 0) {
      const selectedDateStr = selectedDate.toDateString();
      const requestsForDate = requests.filter(req => {
        return new Date(req.dueDate).toDateString() === selectedDateStr;
      });
      setEventsForDate(requestsForDate);
      
      // Log pour debug
      console.log("Événements pour la date sélectionnée:", requestsForDate);
      if (requestsForDate.length > 0) {
        requestsForDate.forEach(req => {
          console.log(`Requête ${req.id}, Mission ID: ${req.missionId}, Nom mission trouvé: ${findMissionName(req.missionId)}`);
        });
      }
    }
  }, [selectedDate, requests]);

  // Fonction pour trouver le nom d'une mission à partir de son ID
  const findMissionName = (missionId: string | undefined) => {
    if (!missionId) return "Sans mission";
    
    // Vérifier d'abord notre cache de noms de mission
    if (missionNames[missionId]) {
      return missionNames[missionId];
    }
    
    // Ensuite, chercher dans le tableau de missions
    const mission = missions && missions.find(m => m.id === missionId);
    
    if (mission) {
      // Mettre en cache ce nom de mission pour les recherches futures
      setMissionNames(prev => ({...prev, [missionId]: mission.name}));
      return mission.name;
    }
    
    // Traitement spécifique pour les IDs de mission de test
    if (missionId === "mission1") return "Acme Corp";
    if (missionId === "mission2") return "TechStart";
    if (missionId === "mission3") return "Global Finance";
    
    // Cas de repli
    console.warn(`Mission ID non trouvée: ${missionId}`);
    return "Mission inconnue";
  };

  return {
    selectedDate,
    setSelectedDate,
    eventsForDate,
    datesWithEvents,
    findMissionName,
    isLoadingRequests
  };
};
