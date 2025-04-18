
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllRequests } from "@/services/requestService";
import { getAllSupaMissions } from "@/services/missions";
import { Request, Mission } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { mapSupaMissionToMission } from "@/services/missions/utils";

export const useCalendarEvents = (userId: string | undefined) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [eventsForDate, setEventsForDate] = useState<Request[]>([]);
  const [datesWithEvents, setDatesWithEvents] = useState<Date[]>([]);
  const [missionNames, setMissionNames] = useState<Record<string, string>>({});
  const [missionsLoaded, setMissionsLoaded] = useState<boolean>(false);

  // Récupérer toutes les requêtes
  const { data: requests = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: ['calendar-requests'],
    queryFn: getAllRequests,
    enabled: !!userId
  });

  // Récupérer toutes les missions
  const { data: missionsRaw = [], isLoading: isLoadingMissions } = useQuery<Mission[]>({
    queryKey: ['calendar-missions'],
    queryFn: async () => {
      try {
        console.log("DEBUG - Récupération directe des missions depuis Supabase");
        const { data, error } = await supabase
          .from("missions")
          .select("*");
        
        if (error) {
          console.error("Erreur lors de la récupération directe des missions:", error);
          return [];
        }
        
        // Mapper les données brutes au format Mission attendu par l'application
        const mappedMissions = data.map(mission => mapSupaMissionToMission(mission));
        console.log(`DEBUG - ${mappedMissions.length} missions récupérées et mappées:`, mappedMissions);
        return mappedMissions;
      } catch (err) {
        console.error("Exception lors de la récupération directe des missions:", err);
        return [];
      }
    },
    enabled: !!userId
  });

  // Construire un map des noms de mission à partir des données récupérées
  useEffect(() => {
    if (missionsRaw && missionsRaw.length > 0) {
      console.log("DEBUG - Missions récupérées pour le calendrier:", missionsRaw);
      console.log("DEBUG - Nombre total de missions:", missionsRaw.length);
      
      // Afficher les IDs et noms de toutes les missions pour vérifier
      missionsRaw.forEach(mission => {
        console.log(`DEBUG - Mission ID: ${mission.id} (${typeof mission.id}), Nom: ${mission.name}`);
      });
      
      const missionMap: Record<string, string> = {};
      missionsRaw.forEach(mission => {
        if (mission && mission.id) {
          // Toujours stocker les IDs sous forme de chaînes
          const missionId = String(mission.id);
          missionMap[missionId] = mission.name || "Mission sans nom";
          console.log(`DEBUG - Ajout au map: [${missionId}] = ${mission.name || "Mission sans nom"}`);
        }
      });
      
      setMissionNames(missionMap);
      setMissionsLoaded(true);
      console.log("DEBUG - Mission map créée:", missionMap);
    } else {
      console.log("DEBUG - Aucune mission récupérée ou tableau vide");
    }
  }, [missionsRaw]);

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
          console.log(`DEBUG - Requête ${req.id}, Type: ${req.type}, Mission ID: ${req.missionId} (${typeof req.missionId}), Mission Name: ${req.missionName || 'non défini'}`);
          if (req.missionId) {
            // Vérifier si la mission existe dans notre map
            const missionName = findMissionName(req.missionId);
            console.log(`DEBUG - Nom de mission trouvé pour ${req.id}: ${missionName}`);
          }
        });
      }
    }
  }, [selectedDate, requests, missionsLoaded]);

  // Fonction améliorée pour trouver le nom d'une mission à partir de son ID
  const findMissionName = (missionId: string | undefined) => {
    // Vérification et normalisation de l'ID de mission
    if (!missionId) {
      console.log("DEBUG - findMissionName: ID de mission non défini");
      return "Sans mission";
    }
    
    // Toujours convertir en chaîne pour être cohérent
    const missionIdStr = String(missionId).trim();
    console.log(`DEBUG - findMissionName: Recherche de mission avec ID: "${missionIdStr}" (type: ${typeof missionIdStr})`);
    
    // 1. Vérifier d'abord notre cache de noms de mission
    if (missionNames[missionIdStr]) {
      console.log(`DEBUG - findMissionName: Trouvé dans le cache: ${missionNames[missionIdStr]}`);
      return missionNames[missionIdStr];
    }
    
    // 2. Ensuite, chercher dans le tableau de missions
    if (missionsRaw && missionsRaw.length > 0) {
      console.log(`DEBUG - findMissionName: Recherche parmi ${missionsRaw.length} missions`);
      console.log(`DEBUG - findMissionName: Liste des IDs disponibles: ${missionsRaw.map(m => String(m.id)).join(', ')}`);
      
      // D'abord essayer une correspondance exacte
      const exactMatch = missionsRaw.find(m => String(m.id) === missionIdStr);
      if (exactMatch) {
        console.log(`DEBUG - findMissionName: Correspondance exacte trouvée: ${exactMatch.name}`);
        // Mettre à jour le cache
        setMissionNames(prev => ({...prev, [missionIdStr]: exactMatch.name}));
        return exactMatch.name;
      }
      
      // Essayer de comparer les UUID sans les tirets
      const normalizedMissionId = missionIdStr.replace(/-/g, '');
      const normalizedMatch = missionsRaw.find(m => String(m.id).replace(/-/g, '') === normalizedMissionId);
      if (normalizedMatch) {
        console.log(`DEBUG - findMissionName: Correspondance normalisée trouvée: ${normalizedMatch.name}`);
        setMissionNames(prev => ({...prev, [missionIdStr]: normalizedMatch.name}));
        return normalizedMatch.name;
      }
      
      // Ensuite essayer une correspondance partielle (au cas où)
      const partialMatch = missionsRaw.find(m => 
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
    if (requests && requests.length > 0) {
      const requestWithMission = requests.find(req => 
        req.missionId === missionIdStr && req.missionName
      );
      
      if (requestWithMission && requestWithMission.missionName) {
        console.log(`DEBUG - findMissionName: Nom trouvé dans la requête: ${requestWithMission.missionName}`);
        return requestWithMission.missionName;
      }
    }
    
    // 5. Cas de repli - essayer une dernière requête directe à Supabase
    (async () => {
      try {
        console.log(`DEBUG - findMissionName: Tentative de requête directe pour ID: ${missionIdStr}`);
        const { data, error } = await supabase
          .from("missions")
          .select("name")
          .eq("id", missionIdStr)
          .maybeSingle();
          
        if (error) {
          console.error("Erreur lors de la requête directe:", error);
          return;
        }
        
        if (data && data.name) {
          console.log(`DEBUG - findMissionName: Trouvé via requête directe: ${data.name}`);
          setMissionNames(prev => ({...prev, [missionIdStr]: data.name}));
        }
      } catch (err) {
        console.error("Exception lors de la requête directe:", err);
      }
    })();
    
    // 6. Cas de repli
    console.warn(`DEBUG - findMissionName: Mission ID non trouvée: ${missionIdStr}`);
    return "Mission inconnue";
  };

  return {
    selectedDate,
    setSelectedDate,
    eventsForDate,
    datesWithEvents,
    findMissionName,
    isLoadingRequests,
    missions: missionsRaw
  };
};
