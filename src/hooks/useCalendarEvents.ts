
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
      console.log("DEBUG - Missions récupérées pour le calendrier:", missions);
      console.log("DEBUG - Nombre total de missions:", missions.length);
      
      // Afficher les IDs et noms de toutes les missions pour vérifier
      missions.forEach(mission => {
        console.log(`DEBUG - Mission ID: ${mission.id} (${typeof mission.id}), Nom: ${mission.name}`);
      });
      
      const missionMap: Record<string, string> = {};
      missions.forEach(mission => {
        if (mission && mission.id) {
          // Toujours stocker les IDs sous forme de chaînes
          const missionId = String(mission.id);
          missionMap[missionId] = mission.name || "Mission sans nom";
          console.log(`DEBUG - Ajout au map: [${missionId}] = ${mission.name || "Mission sans nom"}`);
        }
      });
      
      setMissionNames(missionMap);
      console.log("DEBUG - Mission map créée:", missionMap);
    } else {
      console.log("DEBUG - Aucune mission récupérée ou tableau vide");
    }
  }, [missions]);

  // Définir les dates avec des événements
  useEffect(() => {
    if (requests.length > 0) {
      const eventDates = requests.map(req => new Date(req.dueDate));
      setDatesWithEvents(eventDates);
      console.log(`DEBUG - ${requests.length} requêtes reçues, ${eventDates.length} dates avec événements`);
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
      console.log(`DEBUG - ${requestsForDate.length} événements pour la date sélectionnée:`, requestsForDate);
      if (requestsForDate.length > 0) {
        requestsForDate.forEach(req => {
          console.log(`DEBUG - Requête ${req.id}, Type: ${req.type}, Mission ID: ${req.missionId} (${typeof req.missionId})`);
        });
      }
    }
  }, [selectedDate, requests]);

  // Fonction pour trouver le nom d'une mission à partir de son ID
  const findMissionName = (missionId: string | undefined) => {
    // Vérification et normalisation de l'ID de mission
    if (!missionId) {
      console.log("DEBUG - findMissionName: ID de mission non défini");
      return "Sans mission";
    }
    
    // Toujours convertir en chaîne pour être cohérent
    const missionIdStr = String(missionId);
    console.log(`DEBUG - findMissionName: Recherche de mission avec ID: ${missionIdStr} (type: ${typeof missionIdStr})`);
    
    // 1. Vérifier d'abord notre cache de noms de mission
    if (missionNames[missionIdStr]) {
      console.log(`DEBUG - findMissionName: Trouvé dans le cache: ${missionNames[missionIdStr]}`);
      return missionNames[missionIdStr];
    }
    
    // 2. Ensuite, chercher dans le tableau de missions
    if (missions && missions.length > 0) {
      console.log(`DEBUG - findMissionName: Recherche parmi ${missions.length} missions`);
      
      // D'abord essayer une correspondance exacte
      const exactMatch = missions.find(m => String(m.id) === missionIdStr);
      if (exactMatch) {
        console.log(`DEBUG - findMissionName: Correspondance exacte trouvée: ${exactMatch.name}`);
        setMissionNames(prev => ({...prev, [missionIdStr]: exactMatch.name}));
        return exactMatch.name;
      }
      
      // Ensuite essayer une correspondance partielle (au cas où)
      const partialMatch = missions.find(m => 
        String(m.id).includes(missionIdStr) || missionIdStr.includes(String(m.id))
      );
      if (partialMatch) {
        console.log(`DEBUG - findMissionName: Correspondance partielle trouvée: ${partialMatch.name}`);
        setMissionNames(prev => ({...prev, [missionIdStr]: partialMatch.name}));
        return partialMatch.name;
      }
      
      console.log(`DEBUG - findMissionName: Aucune correspondance trouvée parmi les missions disponibles`);
    } else {
      console.log("DEBUG - findMissionName: Tableau de missions vide ou non défini");
    }
    
    // 3. Traitement spécifique pour les IDs de mission de test
    if (missionIdStr === "mission1") {
      console.log("DEBUG - findMissionName: ID de test mission1 reconnu");
      return "Acme Corp";
    }
    if (missionIdStr === "mission2") {
      console.log("DEBUG - findMissionName: ID de test mission2 reconnu");
      return "TechStart";
    }
    if (missionIdStr === "mission3") {
      console.log("DEBUG - findMissionName: ID de test mission3 reconnu");
      return "Global Finance";
    }
    
    // 4. Vérifier si la requête a déjà un nom de mission défini directement
    // (certaines implémentations peuvent stocker le nom directement dans la requête)
    const requestWithMission = requests.find(req => req.missionId === missionIdStr && req.missionName);
    if (requestWithMission && requestWithMission.missionName) {
      console.log(`DEBUG - findMissionName: Nom trouvé dans la requête: ${requestWithMission.missionName}`);
      return requestWithMission.missionName;
    }
    
    // 5. Cas de repli
    console.warn(`DEBUG - findMissionName: Mission ID non trouvée: ${missionIdStr}`);
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
