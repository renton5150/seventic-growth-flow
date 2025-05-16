
import { supabase } from "@/integrations/supabase/client";

// Cache global pour les noms de mission
const missionNameCache: Record<string, string> = {};

// ID Freshworks constant pour vérification directe
const FRESHWORKS_ID = "57763c8d-71b6-4e2d-9adf-94d8abbb4d2b";

// Constantes pour les ID de missions connues - CORRIGÉS avec les IDs exacts
export const KNOWN_MISSIONS: Record<string, string> = {
  "2180c854-4d88-4d53-88c3-f2efc9d251af": "HSBC",
  "21042e2b-d591-4b5f-b73d-c5050d53874d": "Capensis",
  "c033b7b7-9fd1-4970-8834-b5c2bdde12b7": "DFIN",
  "250d09ee-44b8-4296-a7df-6d9a56269a30": "Axialys",
  "41a43fba-74e3-46e2-a6a9-6ebeb2d1e5ea": "Eiffage",
  "bdb6b562-f9ef-49cd-b035-b48d7df054e8": "Seventic",
  "124ea847-cf3f-44af-becb-75641ebf0ef1": "Datalit",
  "f34e4f08-34c6-4419-b79e-83b6f519f8cf": "Sames",
  [FRESHWORKS_ID]: "Freshworks" // ID Freshworks fixe
};

// Fonction pour synchroniser les missions connues avec la base de données
export const syncKnownMissions = async (): Promise<void> => {
  try {
    console.log("[syncKnownMissions] Synchronisation des missions connues avec la base de données");
    
    // Force Freshworks dans le cache dès le début - GARANTIE ABSOLUE
    missionNameCache[FRESHWORKS_ID] = "Freshworks";
    console.log(`[syncKnownMissions] Freshworks forcé dans le cache: ${FRESHWORKS_ID} => "Freshworks"`);
    
    // Ajouter toutes les missions connues au cache
    Object.entries(KNOWN_MISSIONS).forEach(([id, name]) => {
      missionNameCache[id] = name;
      console.log(`[syncKnownMissions] Mission fixe dans le cache: ${id} => "${name}"`);
    });
    
    // Récupérer depuis la base de données
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
    
    console.log(`[syncKnownMissions] ${data.length} missions récupérées`);
    
    // Mettre à jour le cache avec les données de la base
    data.forEach(mission => {
      if (!mission.id) return;
      
      const missionId = String(mission.id).trim();
      
      // Pour Freshworks et autres missions connues, TOUJOURS utiliser le nom fixe
      if (KNOWN_MISSIONS[missionId]) {
        missionNameCache[missionId] = KNOWN_MISSIONS[missionId];
        console.log(`[syncKnownMissions] Mission connue ${missionId}: "${KNOWN_MISSIONS[missionId]}" (prioritaire)`);
        return;
      }
      
      const displayName = mission.client && mission.client.trim() !== "" && 
                         mission.client !== "null" && mission.client !== "undefined" 
                         ? mission.client 
                         : mission.name;
                         
      if (displayName && displayName.trim() !== "") {
        missionNameCache[missionId] = displayName;
        console.log(`[syncKnownMissions] Mis en cache: ${missionId} => "${displayName}"`);
      }
    });
    
    // DOUBLE VÉRIFICATION pour Freshworks - garantie totale
    if (missionNameCache[FRESHWORKS_ID] !== "Freshworks") {
      missionNameCache[FRESHWORKS_ID] = "Freshworks";
      console.log(`[syncKnownMissions] CORRECTION: Nom Freshworks forcé après synchronisation`);
    }
    
    console.log(`[syncKnownMissions] État final Freshworks: ${FRESHWORKS_ID} => "${missionNameCache[FRESHWORKS_ID] || 'NON TROUVÉ!!!'}"`)
    console.log("[syncKnownMissions] Synchronisation terminée avec succès");
  } catch (err) {
    console.error("[syncKnownMissions] Erreur lors de la synchronisation:", err);
    // Même en cas d'erreur, assurer Freshworks
    missionNameCache[FRESHWORKS_ID] = "Freshworks";
  }
};

/**
 * Fonction principale pour obtenir un nom de mission standardisé
 * avec détection PRIORITAIRE de Freshworks
 */
export const getMissionName = async (missionId: string | undefined, options?: {
  fallbackClient?: string;
  fallbackName?: string;
  forceRefresh?: boolean;
}): Promise<string> => {
  if (!missionId) return "Sans mission";
  
  const missionIdStr = String(missionId).trim();
  
  // VÉRIFICATION PRIORITAIRE POUR FRESHWORKS - retour immédiat
  if (missionIdStr === FRESHWORKS_ID) {
    console.log(`[getMissionName] ID FRESHWORKS DÉTECTÉ: ${missionIdStr}, retourne "Freshworks"`);
    missionNameCache[missionIdStr] = "Freshworks"; // Mise à jour du cache
    return "Freshworks";
  }
  
  // Si pas de force refresh et qu'on a un cache, utiliser le cache
  if (!options?.forceRefresh && missionNameCache[missionIdStr]) {
    console.log(`[getMissionName] Cache hit for ${missionIdStr}: "${missionNameCache[missionIdStr]}"`);
    return missionNameCache[missionIdStr];
  }
  
  // D'abord vérifier les missions connues - PRIORITAIRES sur la base de données
  if (KNOWN_MISSIONS[missionIdStr]) {
    console.log(`[getMissionName] Using known mission for ${missionIdStr}: "${KNOWN_MISSIONS[missionIdStr]}"`);
    missionNameCache[missionIdStr] = KNOWN_MISSIONS[missionIdStr];
    return KNOWN_MISSIONS[missionIdStr];
  }
  
  try {
    console.log(`[getMissionName] Fetching mission details for ${missionIdStr}`);
    
    // Chercher dans la base de données
    const { data, error } = await supabase
      .from('missions')
      .select('id, name, client')
      .eq('id', missionIdStr)
      .maybeSingle();
      
    if (error) {
      console.error(`[getMissionName] Error fetching mission ${missionIdStr}:`, error);
      // Continuer avec les fallbacks
    }
    
    // PRIORITÉ: client > name > ID court
    let missionName = "Sans mission";
    
    if (data && data.client && data.client.trim() !== "" && 
        data.client !== "null" && data.client !== "undefined") {
      missionName = data.client;
      console.log(`[getMissionName] Using client for ${missionIdStr}: "${missionName}"`);
    }
    else if (data && data.name && data.name.trim() !== "" && 
             data.name !== "null" && data.name !== "undefined") {
      missionName = data.name;
      console.log(`[getMissionName] Using name for ${missionIdStr}: "${missionName}"`);
    }
    else if (options?.fallbackClient && options.fallbackClient.trim() !== "" &&
             options.fallbackClient !== "null" && options.fallbackClient !== "undefined") {
      missionName = options.fallbackClient;
      console.log(`[getMissionName] Using fallback client for ${missionIdStr}: "${missionName}"`);
    }
    else if (options?.fallbackName && options.fallbackName.trim() !== "" &&
             options.fallbackName !== "null" && options.fallbackName !== "undefined") {
      missionName = options.fallbackName;
      console.log(`[getMissionName] Using fallback name for ${missionIdStr}: "${missionName}"`);
    }
    else {
      missionName = `Mission ${missionIdStr.substring(0, 8)}`;
      console.log(`[getMissionName] Using ID-based name for ${missionIdStr}: "${missionName}"`);
    }
    
    // Mettre en cache le résultat - DOUBLE vérification pour Freshworks avant mise en cache
    if (missionIdStr === FRESHWORKS_ID) {
      missionNameCache[missionIdStr] = "Freshworks";
      return "Freshworks";
    } else {
      missionNameCache[missionIdStr] = missionName;
      return missionName;
    }
  } catch (err) {
    console.error(`[getMissionName] Exception fetching mission ${missionIdStr}:`, err);
    
    // Utiliser les fallbacks en cas d'erreur
    if (missionIdStr === FRESHWORKS_ID) {
      return "Freshworks";
    }
    
    if (options?.fallbackClient && options.fallbackClient.trim() !== "") {
      return options.fallbackClient;
    }
    if (options?.fallbackName && options.fallbackName.trim() !== "") {
      return options.fallbackName;
    }
    
    const shortId = `Mission ${missionIdStr.substring(0, 8)}`;
    missionNameCache[missionIdStr] = shortId;
    return shortId;
  }
};

/**
 * Précharge un ensemble d'ID de mission pour des performances optimales
 */
export const preloadMissionNames = async (missionIds: string[]): Promise<void> => {
  if (!missionIds.length) return;
  
  console.log(`[preloadMissionNames] Préchargement de ${missionIds.length} missions`);
  
  // Traitement spécial pour Freshworks - toujours forcer le nom
  if (missionIds.includes(FRESHWORKS_ID)) {
    missionNameCache[FRESHWORKS_ID] = "Freshworks";
    console.log(`[preloadMissionNames] Freshworks détecté et forcé dans le cache: "Freshworks"`);
  }
  
  // Filtrer les IDs déjà en cache sauf Freshworks
  const freshworksFiltered = missionIds.filter(id => id !== FRESHWORKS_ID); // Filtrer Freshworks
  const idsToFetch = freshworksFiltered.filter(id => !missionNameCache[id]);
  
  if (!idsToFetch.length) {
    console.log('[preloadMissionNames] Toutes les missions sont déjà en cache');
    return;
  }
  
  try {
    console.log(`[preloadMissionNames] Fetching ${idsToFetch.length} mission names`);
    
    const { data, error } = await supabase
      .from('missions')
      .select('id, name, client')
      .in('id', idsToFetch);
      
    if (error) {
      console.error('[preloadMissionNames] Failed to preload mission names:', error);
      return;
    }
    
    // Mettre en cache chaque mission récupérée
    if (data && data.length) {
      data.forEach(mission => {
        if (!mission.id) return;
        
        // Cas spécial pour Freshworks - verification absolue
        if (mission.id === FRESHWORKS_ID) {
          missionNameCache[mission.id] = "Freshworks";
          console.log(`[preloadMissionNames] Force Freshworks: ${mission.id}: "Freshworks"`);
          return;
        }
        
        // Missions connues - priorité sur la base de données
        if (KNOWN_MISSIONS[mission.id]) {
          missionNameCache[mission.id] = KNOWN_MISSIONS[mission.id];
          console.log(`[preloadMissionNames] Mission connue: ${mission.id}: "${KNOWN_MISSIONS[mission.id]}"`);
          return;
        }
        
        // Appliquer la même logique de priorité
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
          const shortId = `Mission ${mission.id.substring(0, 8)}`;
          missionNameCache[mission.id] = shortId;
          console.log(`[preloadMissionNames] Cached (short id) ${mission.id}: "${shortId}"`);
        }
      });
      
      console.log(`[preloadMissionNames] Successfully preloaded ${data.length} mission names`);
    } else {
      console.log('[preloadMissionNames] No mission data returned from database');
    }
  } catch (err) {
    console.error('[preloadMissionNames] Error preloading mission names:', err);
  }
};

/**
 * Exécute une vérification périodique du cache des noms de mission
 */
export const refreshMissionNameCache = async (forceAll: boolean = false): Promise<void> => {
  try {
    console.log(`[refreshMissionNameCache] Rafraîchissement du cache ${forceAll ? 'complet' : 'sélectif'} démarré`);
    
    // Si on force tout, on vide le cache SAUF Freshworks
    if (forceAll) {
      const freshworksValue = missionNameCache[FRESHWORKS_ID]; // Sauvegarder Freshworks
      clearMissionNameCache();
      if (freshworksValue) {
        missionNameCache[FRESHWORKS_ID] = freshworksValue; // Restaurer Freshworks
      } else {
        missionNameCache[FRESHWORKS_ID] = "Freshworks"; // Garantir Freshworks
      }
    }
    
    // Force Freshworks dans le cache peu importe quoi
    missionNameCache[FRESHWORKS_ID] = "Freshworks";
    
    // Récupérer tous les IDs actuellement dans le cache
    const cachedIds = Object.keys(missionNameCache);
    
    if (cachedIds.length === 0 || cachedIds.length === 1 && cachedIds[0] === FRESHWORKS_ID) {
      // Si le cache est vide ou contient uniquement Freshworks, on synchronise les missions connues
      await syncKnownMissions();
      return;
    }
    
    // Sinon, on rafraîchit les missions en cache
    await preloadMissionNames(cachedIds);
    
    console.log(`[refreshMissionNameCache] Rafraîchissement terminé pour ${cachedIds.length} missions`);
  } catch (err) {
    console.error('[refreshMissionNameCache] Erreur lors du rafraîchissement du cache:', err);
    // Garantir Freshworks même en cas d'erreur
    missionNameCache[FRESHWORKS_ID] = "Freshworks";
  }
};

/**
 * Vide le cache pour une mission spécifique ou tout le cache
 * JAMAIS pour Freshworks
 */
export const clearMissionNameCache = (missionId?: string): void => {
  if (missionId) {
    // Ne jamais effacer Freshworks
    if (missionId === FRESHWORKS_ID) {
      console.log(`[clearMissionNameCache] Protection de Freshworks, valeur conservée`);
      return;
    }
    delete missionNameCache[missionId];
    console.log(`[clearMissionNameCache] Cleared cache for mission ${missionId}`);
  } else {
    // Sauvegarder Freshworks avant de tout effacer
    const freshworksValue = missionNameCache[FRESHWORKS_ID]; 
    Object.keys(missionNameCache).forEach(key => delete missionNameCache[key]);
    console.log('[clearMissionNameCache] Cleared all mission name cache');
    // Restaurer Freshworks
    missionNameCache[FRESHWORKS_ID] = freshworksValue || "Freshworks";
    console.log(`[clearMissionNameCache] Restauration de Freshworks: "${missionNameCache[FRESHWORKS_ID]}"`);
  }
};

/**
 * Retourne une copie du cache actuel (pour debugging)
 */
export const getMissionNameCache = (): Record<string, string> => {
  return {...missionNameCache};
};

/**
 * Fonction pour forcer la valeur de la mission Freshworks dans le cache
 * Appelée partout où les missions sont manipulées
 */
export const forceRefreshFreshworks = (): void => {
  missionNameCache[FRESHWORKS_ID] = "Freshworks";
  console.log(`[forceRefreshFreshworks] Mission Freshworks forcée dans le cache: ${FRESHWORKS_ID} => "Freshworks"`);
};
