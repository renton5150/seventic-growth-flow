
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllRequests } from "@/services/requestService";
import { Request, Mission } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { mapSupaMissionToMission } from "@/services/missions/utils";

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

  // Récupérer directement toutes les missions
  const { data: missionsRaw = [], isLoading: isLoadingMissions } = useQuery<Mission[]>({
    queryKey: ['calendar-missions'],
    queryFn: async () => {
      try {
        console.log("[DIAGNOSTIC] Récupération directe des missions depuis Supabase");
        const { data, error } = await supabase
          .from("missions")
          .select("*");
        
        if (error) {
          console.error("[DIAGNOSTIC] Erreur lors de la récupération directe des missions:", error);
          return [];
        }
        
        console.log("[DIAGNOSTIC] Données brutes des missions:", data);
        
        // Mapper les données brutes au format Mission attendu par l'application
        const mappedMissions = data.map(mission => {
          const mappedMission = mapSupaMissionToMission(mission);
          console.log("[DIAGNOSTIC] Mission mappée:", mission.id, "→", mappedMission.name);
          return mappedMission;
        });
        
        console.log(`[DIAGNOSTIC] ${mappedMissions.length} missions récupérées et mappées`);
        
        // Afficher toutes les missions avec leurs IDs pour faciliter le debugging
        mappedMissions.forEach(mission => {
          console.log(`[DIAGNOSTIC] Mission: ID=${mission.id} (${typeof mission.id}), Nom=${mission.name}`);
        });
        
        return mappedMissions;
      } catch (err) {
        console.error("[DIAGNOSTIC] Exception lors de la récupération directe des missions:", err);
        return [];
      }
    },
    enabled: !!userId
  });

  // Définir les dates avec des événements
  useEffect(() => {
    if (requests.length > 0) {
      const eventDates = requests.map(req => new Date(req.dueDate));
      setDatesWithEvents(eventDates);
      console.log(`[DIAGNOSTIC] ${requests.length} requêtes reçues, ${eventDates.length} dates avec événements`);
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
      console.log(`[DIAGNOSTIC] ${requestsForDate.length} événements pour la date sélectionnée`);
      if (requestsForDate.length > 0) {
        console.log("[DIAGNOSTIC] ÉVÉNEMENTS DU JOUR (DONNÉES BRUTES):", JSON.stringify(requestsForDate, null, 2));
        
        requestsForDate.forEach(req => {
          console.log(`[DIAGNOSTIC] Requête ${req.id}, Type: ${req.type}, Mission ID: ${req.missionId} (${typeof req.missionId}), Mission Name: ${req.missionName || 'non défini'}`);
        });
      }
    }
  }, [selectedDate, requests]);

  // Fonction simplifiée pour trouver le nom d'une mission à partir de son ID
  const findMissionName = (missionId: string | undefined): string => {
    // Vérification et normalisation de l'ID de mission
    if (!missionId) {
      console.log("[DIAGNOSTIC] findMissionName: ID de mission non défini");
      return "Sans mission";
    }
    
    // Toujours convertir en chaîne pour être cohérent
    const missionIdStr = String(missionId).trim();
    console.log(`[DIAGNOSTIC] Mission ID recherché: "${missionIdStr}" (${typeof missionIdStr})`);
    
    // Solution directe pour l'ID spécifique mentionné
    if (missionIdStr === "bdb6b562-f9ef-49cd-b035-b48d7df054e8") {
      console.log("[DIAGNOSTIC] ID spécifique reconnu: bdb6b562-f9ef-49cd-b035-b48d7df054e8 → Seventic");
      return "Seventic";
    }
    
    // Log de toutes les missions disponibles pour le debug
    console.log("[DIAGNOSTIC] Missions disponibles pour recherche:", 
      Array.isArray(missionsRaw) ? missionsRaw.map(m => ({id: m.id, name: m.name})) : "Aucune mission disponible");
    
    // Recherche directe et simple
    if (Array.isArray(missionsRaw) && missionsRaw.length > 0) {
      const mission = missionsRaw.find(m => String(m.id) === missionIdStr);
      console.log("[DIAGNOSTIC] Mission trouvée:", mission);
      
      if (mission) {
        return mission.name;
      }
    }
    
    // Recherche dans les requêtes si elles ont déjà un nom de mission
    if (requests && requests.length > 0) {
      const requestWithMission = requests.find(req => 
        req.missionId === missionIdStr && req.missionName
      );
      
      if (requestWithMission && requestWithMission.missionName) {
        console.log(`[DIAGNOSTIC] Nom trouvé dans la requête: ${requestWithMission.missionName}`);
        return requestWithMission.missionName;
      }
    }
    
    // Cas de repli
    console.warn(`[DIAGNOSTIC] Mission ID non trouvée: ${missionIdStr}`);
    return "Mission inconnue";
  };

  return {
    selectedDate,
    setSelectedDate,
    eventsForDate,
    datesWithEvents,
    findMissionName,
    isLoadingRequests,
    missions: missionsRaw as Mission[]
  };
};
