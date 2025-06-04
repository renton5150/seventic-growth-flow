
import { supabase } from "@/integrations/supabase/client";

// Cache global pour les noms de mission
const missionNameCache: Record<string, string> = {};

// IDs Freshworks constants - SEULE EXCEPTION AUTORISÉE
const FRESHWORKS_PRIMARY_ID = "57763c8d-71b6-4e2d-9adf-94d8abbb4d2b";
const FRESHWORKS_SECONDARY_ID = "57763c8d-fa72-433e-9f9e-5511a6a56062";

// Fonction d'aide pour vérifier si un ID correspond à Freshworks
export const isFreshworksId = (id: string | undefined): boolean => {
  if (!id) return false;
  const missionId = String(id).trim();
  return missionId === FRESHWORKS_PRIMARY_ID || missionId === FRESHWORKS_SECONDARY_ID;
};

// Fonction pour vider le cache corrompu
export const clearMissionNameCache = (missionId?: string): void => {
  if (missionId) {
    // Ne jamais effacer Freshworks
    if (isFreshworksId(missionId)) {
      console.log(`[clearMissionNameCache] Protection de Freshworks, valeur conservée`);
      return;
    }
    delete missionNameCache[missionId];
    console.log(`[clearMissionNameCache] Cleared cache for mission ${missionId}`);
  } else {
    // Sauvegarder Freshworks avant de tout effacer
    const freshworksValue1 = missionNameCache[FRESHWORKS_PRIMARY_ID]; 
    const freshworksValue2 = missionNameCache[FRESHWORKS_SECONDARY_ID];
    
    Object.keys(missionNameCache).forEach(key => delete missionNameCache[key]);
    console.log('[clearMissionNameCache] Cache vidé complètement');
    
    // Restaurer Freshworks
    missionNameCache[FRESHWORKS_PRIMARY_ID] = freshworksValue1 || "Freshworks";
    missionNameCache[FRESHWORKS_SECONDARY_ID] = freshworksValue2 || "Freshworks";
    console.log(`[clearMissionNameCache] Freshworks restauré`);
  }
};

// Fonction pour synchroniser UNIQUEMENT avec la base de données réelle
export const syncKnownMissions = async (): Promise<void> => {
  try {
    console.log("[syncKnownMissions] Démarrage synchronisation simplifiée");
    
    // Vider complètement le cache corrompu
    clearMissionNameCache();
    
    // Force Freshworks dans le cache
    missionNameCache[FRESHWORKS_PRIMARY_ID] = "Freshworks";
    missionNameCache[FRESHWORKS_SECONDARY_ID] = "Freshworks";
    console.log(`[syncKnownMissions] Freshworks forcé dans le cache`);
    
    // Récupérer TOUTES les missions depuis la base de données
    const { data, error } = await supabase
      .from('missions')
      .select('id, name, client')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("[syncKnownMissions] Erreur lors de la récupération des missions:", error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log("[syncKnownMissions] Aucune mission trouvée dans la base de données");
      return;
    }
    
    console.log(`[syncKnownMissions] ${data.length} missions récupérées depuis la base`);
    
    // Mettre à jour le cache avec PRIORITÉ ABSOLUE au champ CLIENT
    data.forEach(mission => {
      if (!mission.id) return;
      
      const missionId = String(mission.id).trim();
      
      // Freshworks TOUJOURS prioritaire
      if (isFreshworksId(missionId)) {
        missionNameCache[missionId] = "Freshworks";
        console.log(`[syncKnownMissions] Freshworks confirmé: ${missionId}`);
        return;
      }
      
      // NOUVELLE LOGIQUE SIMPLIFIÉE : CLIENT en priorité absolue
      let displayName = "Sans mission";
      if (mission.client && mission.client.trim() !== "" && 
          mission.client !== "null" && mission.client !== "undefined") {
        displayName = mission.client.trim();
        console.log(`[syncKnownMissions] Mission ${missionId}: "${displayName}" (client)`);
      } else if (mission.name && mission.name.trim() !== "" && 
                 mission.name !== "null" && mission.name !== "undefined") {
        displayName = mission.name.trim();
        console.log(`[syncKnownMissions] Mission ${missionId}: "${displayName}" (name)`);
      } else {
        console.warn(`[syncKnownMissions] Mission ${missionId}: aucune valeur valide trouvée`);
      }
      
      missionNameCache[missionId] = displayName;
    });
    
    console.log(`[syncKnownMissions] Cache final: ${Object.keys(missionNameCache).length} missions`);
    console.log("[syncKnownMissions] Synchronisation terminée avec succès");
  } catch (err) {
    console.error("[syncKnownMissions] Erreur lors de la synchronisation:", err);
    // Même en cas d'erreur, assurer Freshworks
    missionNameCache[FRESHWORKS_PRIMARY_ID] = "Freshworks";
    missionNameCache[FRESHWORKS_SECONDARY_ID] = "Freshworks";
  }
};

/**
 * Fonction principale SIMPLIFIÉE pour obtenir un nom de mission
 */
export const getMissionName = async (missionId: string | undefined, options?: {
  fallbackClient?: string;
  fallbackName?: string;
  forceRefresh?: boolean;
}): Promise<string> => {
  if (!missionId) return "Sans mission";
  
  const missionIdStr = String(missionId).trim();
  
  // FRESHWORKS - retour immédiat
  if (isFreshworksId(missionIdStr)) {
    console.log(`[getMissionName] FRESHWORKS détecté: ${missionIdStr}`);
    missionNameCache[missionIdStr] = "Freshworks";
    return "Freshworks";
  }
  
  // Si pas de force refresh et qu'on a un cache valide (PAS TECHNIQUE), utiliser le cache
  const cachedValue = missionNameCache[missionIdStr];
  if (!options?.forceRefresh && cachedValue && 
      cachedValue !== "Sans mission" && 
      !cachedValue.startsWith("Mission ")) {
    console.log(`[getMissionName] Cache hit valide pour ${missionIdStr}: "${cachedValue}"`);
    return cachedValue;
  }
  
  try {
    console.log(`[getMissionName] Récupération DB pour ${missionIdStr}`);
    
    // Interroger la base de données
    const { data, error } = await supabase
      .from('missions')
      .select('id, name, client')
      .eq('id', missionIdStr)
      .maybeSingle();
      
    if (error) {
      console.error(`[getMissionName] Erreur DB pour ${missionIdStr}:`, error);
    }
    
    // LOGIQUE SIMPLIFIÉE : CLIENT > NAME > FALLBACKS > "Sans mission"
    let missionName = "Sans mission";
    
    if (data) {
      if (data.client && data.client.trim() !== "" && 
          data.client !== "null" && data.client !== "undefined") {
        missionName = data.client.trim();
        console.log(`[getMissionName] CLIENT DB pour ${missionIdStr}: "${missionName}"`);
      }
      else if (data.name && data.name.trim() !== "" && 
               data.name !== "null" && data.name !== "undefined") {
        missionName = data.name.trim();
        console.log(`[getMissionName] NAME DB pour ${missionIdStr}: "${missionName}"`);
      }
    }
    
    // Fallbacks SEULEMENT si pas de données DB valides
    if (missionName === "Sans mission") {
      if (options?.fallbackClient && options.fallbackClient.trim() !== "" &&
           options.fallbackClient !== "null" && options.fallbackClient !== "undefined") {
        missionName = options.fallbackClient.trim();
        console.log(`[getMissionName] Fallback client pour ${missionIdStr}: "${missionName}"`);
      }
      else if (options?.fallbackName && options.fallbackName.trim() !== "" &&
               options.fallbackName !== "null" && options.fallbackName !== "undefined") {
        missionName = options.fallbackName.trim();
        console.log(`[getMissionName] Fallback name pour ${missionIdStr}: "${missionName}"`);
      }
    }
    
    // PLUS DE NOMS TECHNIQUES - on garde "Sans mission" si rien trouvé
    missionNameCache[missionIdStr] = missionName;
    return missionName;
  } catch (err) {
    console.error(`[getMissionName] Exception pour ${missionIdStr}:`, err);
    
    // En cas d'erreur, utiliser les fallbacks ou retourner "Sans mission"
    if (isFreshworksId(missionIdStr)) {
      return "Freshworks";
    }
    
    if (options?.fallbackClient && options.fallbackClient.trim() !== "") {
      return options.fallbackClient.trim();
    }
    if (options?.fallbackName && options.fallbackName.trim() !== "") {
      return options.fallbackName.trim();
    }
    
    // PLUS JAMAIS de nom technique
    return "Sans mission";
  }
};

/**
 * Précharge un ensemble d'ID de mission
 */
export const preloadMissionNames = async (missionIds: string[]): Promise<void> => {
  if (!missionIds.length) return;
  
  console.log(`[preloadMissionNames] Préchargement de ${missionIds.length} missions`);
  
  // Traitement spécial pour Freshworks
  const hasFreshworks = missionIds.some(id => isFreshworksId(id));
  if (hasFreshworks) {
    missionNameCache[FRESHWORKS_PRIMARY_ID] = "Freshworks";
    missionNameCache[FRESHWORKS_SECONDARY_ID] = "Freshworks";
    console.log(`[preloadMissionNames] Freshworks détecté et forcé`);
  }
  
  // Filtrer les IDs déjà en cache VALIDE (pas technique)
  const idsToFetch = missionIds.filter(id => {
    if (isFreshworksId(id)) return false;
    const cached = missionNameCache[id];
    return !cached || cached === "Sans mission" || cached.startsWith("Mission ");
  });
  
  if (!idsToFetch.length) {
    console.log('[preloadMissionNames] Toutes les missions sont déjà en cache valide');
    return;
  }
  
  try {
    console.log(`[preloadMissionNames] Fetching ${idsToFetch.length} mission names`);
    
    const { data, error } = await supabase
      .from('missions')
      .select('id, name, client')
      .in('id', idsToFetch);
      
    if (error) {
      console.error('[preloadMissionNames] Erreur:', error);
      return;
    }
    
    // Mettre en cache chaque mission avec la logique simplifiée
    if (data && data.length) {
      data.forEach(mission => {
        if (!mission.id) return;
        
        // Freshworks check
        if (isFreshworksId(mission.id)) {
          missionNameCache[mission.id] = "Freshworks";
          console.log(`[preloadMissionNames] Freshworks: ${mission.id}`);
          return;
        }
        
        // LOGIQUE SIMPLIFIÉE : CLIENT prioritaire
        if (mission.client && mission.client.trim() !== "" && 
            mission.client !== "null" && mission.client !== "undefined") {
          missionNameCache[mission.id] = mission.client;
          console.log(`[preloadMissionNames] Cached (client) ${mission.id}: "${mission.client}"`);
        }
        else if (mission.name && mission.name.trim() !== "" && 
                mission.name !== "null" && mission.name !== "undefined") {
          missionNameCache[mission.id] = mission.name;
          console.log(`[preloadMissionNames] Cached (name) ${mission.id}: "${mission.name}"`);
        }
        else {
          missionNameCache[mission.id] = "Sans mission";
          console.log(`[preloadMissionNames] Cached (sans mission) ${mission.id}`);
        }
      });
      
      console.log(`[preloadMissionNames] Successfully preloaded ${data.length} mission names`);
    }
  } catch (err) {
    console.error('[preloadMissionNames] Error:', err);
  }
};

/**
 * Force Freshworks dans le cache
 */
export const forceRefreshFreshworks = (): void => {
  missionNameCache[FRESHWORKS_PRIMARY_ID] = "Freshworks";
  missionNameCache[FRESHWORKS_SECONDARY_ID] = "Freshworks";
  console.log(`[forceRefreshFreshworks] Freshworks forcé`);
};

/**
 * Retourne une copie du cache actuel (pour debugging)
 */
export const getMissionNameCache = (): Record<string, string> => {
  return {...missionNameCache};
};

/**
 * Rafraîchissement périodique du cache
 */
export const refreshMissionNameCache = async (forceAll: boolean = false): Promise<void> => {
  try {
    console.log(`[refreshMissionNameCache] Rafraîchissement ${forceAll ? 'complet' : 'sélectif'} démarré`);
    
    if (forceAll) {
      // Vider le cache et re-synchroniser
      await syncKnownMissions();
      return;
    }
    
    // Rafraîchissement sélectif des missions en cache
    const cachedIds = Object.keys(missionNameCache).filter(id => !isFreshworksId(id));
    
    if (cachedIds.length > 0) {
      await preloadMissionNames(cachedIds);
    }
    
    console.log(`[refreshMissionNameCache] Rafraîchissement terminé`);
  } catch (err) {
    console.error('[refreshMissionNameCache] Erreur:', err);
    // Garantir Freshworks même en cas d'erreur
    missionNameCache[FRESHWORKS_PRIMARY_ID] = "Freshworks";
    missionNameCache[FRESHWORKS_SECONDARY_ID] = "Freshworks";
  }
};
