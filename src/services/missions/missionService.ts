
import { supabase } from "@/integrations/supabase/client";

export interface MissionData {
  id: string;
  name: string;
  client: string;
  sdr_id: string | null;
}

// Cache des missions pour éviter les requêtes répétées
let missionsCache: Map<string, MissionData> = new Map();
let allMissionsCache: MissionData[] = [];
let lastCacheUpdate = 0;
const CACHE_DURATION = 30000; // 30 secondes

// Fonction pour récupérer TOUTES les missions directement depuis la table
export const getAllMissions = async (): Promise<MissionData[]> => {
  const now = Date.now();
  
  // Vérifier le cache
  if (allMissionsCache.length > 0 && now - lastCacheUpdate < CACHE_DURATION) {
    console.log("[getAllMissions] Utilisation du cache");
    return allMissionsCache;
  }

  try {
    console.log("[getAllMissions] Récupération depuis la base de données");
    
    const { data, error } = await supabase
      .from('missions')
      .select('id, name, client, sdr_id')
      .order('name');

    if (error) {
      console.error("[getAllMissions] Erreur Supabase:", error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log("[getAllMissions] Aucune mission trouvée");
      return [];
    }

    // Traiter et mettre en cache
    allMissionsCache = data.map(mission => ({
      id: mission.id,
      name: mission.name || "",
      client: mission.client || "",
      sdr_id: mission.sdr_id
    }));

    // Mettre à jour le cache des missions individuelles
    missionsCache.clear();
    allMissionsCache.forEach(mission => {
      missionsCache.set(mission.id, mission);
    });

    lastCacheUpdate = now;
    
    console.log(`[getAllMissions] ${allMissionsCache.length} missions chargées:`, allMissionsCache);
    
    return allMissionsCache;
  } catch (error) {
    console.error("[getAllMissions] Exception:", error);
    return [];
  }
};

// Fonction pour obtenir le nom d'affichage d'une mission
export const getMissionDisplayName = (mission: MissionData): string => {
  // Priorité : client d'abord, puis name, puis "Sans nom"
  if (mission.client && mission.client.trim() !== '') {
    return mission.client.trim();
  }
  
  if (mission.name && mission.name.trim() !== '') {
    return mission.name.trim();
  }
  
  return "Sans nom";
};

// Fonction pour récupérer une mission par ID
export const getMissionById = async (missionId: string): Promise<string> => {
  if (!missionId) {
    return "Sans mission";
  }

  // Vérifier le cache d'abord
  if (missionsCache.has(missionId)) {
    const mission = missionsCache.get(missionId)!;
    return getMissionDisplayName(mission);
  }

  // Si pas en cache, charger toutes les missions
  await getAllMissions();
  
  // Vérifier à nouveau le cache
  if (missionsCache.has(missionId)) {
    const mission = missionsCache.get(missionId)!;
    return getMissionDisplayName(mission);
  }

  console.warn(`[getMissionById] Mission ${missionId} non trouvée`);
  return "Sans mission";
};

// Fonction pour récupérer les missions pour un utilisateur SDR
export const getMissionsForUser = async (userId: string): Promise<MissionData[]> => {
  const allMissions = await getAllMissions();
  return allMissions.filter(mission => mission.sdr_id === userId);
};

// Fonction pour vider le cache (utile pour forcer le rafraîchissement)
export const clearMissionsCache = () => {
  console.log("[clearMissionsCache] Cache vidé");
  missionsCache.clear();
  allMissionsCache = [];
  lastCacheUpdate = 0;
};
