
import { supabase } from "@/integrations/supabase/client";

// Cache global pour les noms de mission - UNIQUEMENT LES VRAIES DONNÉES
const missionNameCache: Record<string, string> = {};

// Fonction pour vider le cache
export const clearMissionNameCache = (missionId?: string): void => {
  if (missionId) {
    delete missionNameCache[missionId];
    console.log(`[clearMissionNameCache] Cleared cache for mission ${missionId}`);
  } else {
    Object.keys(missionNameCache).forEach(key => delete missionNameCache[key]);
    console.log('[clearMissionNameCache] Cache vidé complètement');
  }
};

// Fonction pour vérifier si un ID correspond à Freshworks
export const isFreshworksId = (missionId: string): boolean => {
  if (!missionId) return false;
  const freshworksIds = [
    "57763c8d-71b6-4e2d-9adf-94d8abbb4d2b",
    "freshworks"
  ];
  return freshworksIds.includes(missionId.toLowerCase());
};

// Fonction pour forcer le rafraîchissement du cache Freshworks
export const forceRefreshFreshworks = (): void => {
  const freshworksIds = [
    "57763c8d-71b6-4e2d-9adf-94d8abbb4d2b",
    "freshworks"
  ];
  
  freshworksIds.forEach(id => {
    missionNameCache[id] = "Freshworks";
  });
  
  console.log("[forceRefreshFreshworks] Cache Freshworks forcé");
};

// Fonction pour synchroniser avec la base de données réelle
export const syncKnownMissions = async (): Promise<void> => {
  try {
    console.log("[syncKnownMissions] DÉMARRAGE - Synchronisation depuis la base de données");
    
    // Vider le cache pour repartir à zéro
    clearMissionNameCache();
    
    // Forcer Freshworks d'abord
    forceRefreshFreshworks();
    
    // Récupérer TOUTES les missions depuis la base de données
    const { data, error } = await supabase
      .from('missions')
      .select('id, name, client')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("[syncKnownMissions] ERREUR lors de la récupération des missions:", error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.warn("[syncKnownMissions] ATTENTION: Aucune mission trouvée dans la base de données");
      return;
    }
    
    console.log(`[syncKnownMissions] ${data.length} missions récupérées depuis la base`);
    
    // Traiter chaque mission et mettre le cache à jour
    data.forEach(mission => {
      if (!mission.id) return;
      
      const missionId = String(mission.id).trim();
      
      // UTILISER EXCLUSIVEMENT LE CHAMP CLIENT en priorité, sinon NAME
      let finalName = "Sans mission";
      
      if (mission.client && String(mission.client).trim() !== "") {
        finalName = String(mission.client).trim();
        console.log(`[syncKnownMissions] ✅ Mission ${missionId}: CLIENT="${finalName}"`);
      } else if (mission.name && String(mission.name).trim() !== "") {
        finalName = String(mission.name).trim();
        console.log(`[syncKnownMissions] ⚠️ Mission ${missionId}: NAME="${finalName}" (fallback)`);
      } else {
        console.error(`[syncKnownMissions] ❌ Mission ${missionId}: Aucun nom trouvé`);
      }
      
      missionNameCache[missionId] = finalName;
    });
    
    console.log(`[syncKnownMissions] ✅ TERMINÉ - Cache final: ${Object.keys(missionNameCache).length} missions`);
    
    // Debug: Afficher le contenu final du cache
    Object.entries(missionNameCache).forEach(([id, name]) => {
      console.log(`[syncKnownMissions] CACHE: ${id} => "${name}"`);
    });
    
  } catch (err) {
    console.error("[syncKnownMissions] EXCEPTION lors de la synchronisation:", err);
  }
};

/**
 * Fonction pour obtenir un nom de mission depuis la base de données
 */
export const getMissionName = async (missionId: string | undefined, options?: {
  fallbackClient?: string;
  fallbackName?: string;
  forceRefresh?: boolean;
}): Promise<string> => {
  if (!missionId) {
    console.log(`[getMissionName] ID vide => "Sans mission"`);
    return "Sans mission";
  }
  
  const missionIdStr = String(missionId).trim();
  console.log(`[getMissionName] DÉBUT - Récupération nom pour: ${missionIdStr}`);
  
  // PRIORITÉ ABSOLUE: Vérifier Freshworks d'abord
  if (isFreshworksId(missionIdStr)) {
    console.log(`[getMissionName] ✅ FRESHWORKS détecté pour ${missionIdStr}`);
    missionNameCache[missionIdStr] = "Freshworks";
    return "Freshworks";
  }
  
  // PRIORITÉ 2: Utiliser les fallbacks fournis AVANT d'interroger la base
  if (options?.fallbackClient && String(options.fallbackClient).trim() !== "") {
    const clientName = String(options.fallbackClient).trim();
    console.log(`[getMissionName] ✅ FALLBACK CLIENT DIRECT pour ${missionIdStr}: "${clientName}"`);
    missionNameCache[missionIdStr] = clientName;
    return clientName;
  }
  
  // Vérifier le cache SEULEMENT si pas de force refresh et pas de fallback
  const cachedValue = missionNameCache[missionIdStr];
  if (!options?.forceRefresh && cachedValue && cachedValue !== "Sans mission") {
    console.log(`[getMissionName] ✅ CACHE VALIDE pour ${missionIdStr}: "${cachedValue}"`);
    return cachedValue;
  }
  
  try {
    console.log(`[getMissionName] 🔍 INTERROGATION DB pour ${missionIdStr}`);
    
    // Interroger la base de données
    const { data, error } = await supabase
      .from('missions')
      .select('id, client, name')
      .eq('id', missionIdStr)
      .maybeSingle();
      
    if (error) {
      console.error(`[getMissionName] ❌ ERREUR DB pour ${missionIdStr}:`, error);
    }
    
    let finalName = "Sans mission";
    
    if (data) {
      console.log(`[getMissionName] 📋 DONNÉES DB pour ${missionIdStr}:`, {
        client: data.client,
        name: data.name
      });
      
      // UTILISER EXCLUSIVEMENT LE CHAMP CLIENT en priorité
      if (data.client && String(data.client).trim() !== "") {
        finalName = String(data.client).trim();
        console.log(`[getMissionName] ✅ CLIENT DB pour ${missionIdStr}: "${finalName}"`);
      }
      // Fallback vers name seulement si client vide
      else if (data.name && String(data.name).trim() !== "") {
        finalName = String(data.name).trim();
        console.log(`[getMissionName] ⚠️ NAME DB fallback pour ${missionIdStr}: "${finalName}"`);
      } else {
        console.error(`[getMissionName] ❌ TOUS LES CHAMPS DB VIDES pour ${missionIdStr}`);
      }
    } else {
      console.warn(`[getMissionName] ⚠️ AUCUNE DONNÉE DB pour ${missionIdStr}`);
    }
    
    // Utiliser les fallbacks SEULEMENT si pas de données DB valides
    if (finalName === "Sans mission" && options?.fallbackName && String(options.fallbackName).trim() !== "") {
      finalName = String(options.fallbackName).trim();
      console.log(`[getMissionName] 🔄 FALLBACK NAME pour ${missionIdStr}: "${finalName}"`);
    }
    
    console.log(`[getMissionName] ✅ RÉSULTAT FINAL pour ${missionIdStr}: "${finalName}"`);
    missionNameCache[missionIdStr] = finalName;
    return finalName;
    
  } catch (err) {
    console.error(`[getMissionName] ❌ EXCEPTION pour ${missionIdStr}:`, err);
    
    // En cas d'erreur, utiliser les fallbacks valides ou retourner "Sans mission"
    if (options?.fallbackClient && String(options.fallbackClient).trim() !== "") {
      console.log(`[getMissionName] 🔄 EXCEPTION FALLBACK CLIENT: "${options.fallbackClient}"`);
      return String(options.fallbackClient).trim();
    }
    
    if (options?.fallbackName && String(options.fallbackName).trim() !== "") {
      console.log(`[getMissionName] 🔄 EXCEPTION FALLBACK NAME: "${options.fallbackName}"`);
      return String(options.fallbackName).trim();
    }
    
    console.log(`[getMissionName] ❌ EXCEPTION - RETOUR: "Sans mission"`);
    return "Sans mission";
  }
};

/**
 * Précharge un ensemble d'ID de mission
 */
export const preloadMissionNames = async (missionIds: string[]): Promise<void> => {
  if (!missionIds.length) return;
  
  console.log(`[preloadMissionNames] 🚀 PRÉCHARGEMENT de ${missionIds.length} missions`);
  
  // Filtrer les IDs à récupérer (pas en cache ou valeur technique)
  const idsToFetch = missionIds.filter(id => {
    const cached = missionNameCache[id];
    const needsFetch = !cached || cached === "Sans mission";
    if (needsFetch) {
      console.log(`[preloadMissionNames] 🔍 À récupérer: ${id} (cache="${cached}")`);
    }
    return needsFetch;
  });
  
  if (!idsToFetch.length) {
    console.log('[preloadMissionNames] ✅ Toutes les missions sont déjà en cache valide');
    return;
  }
  
  try {
    console.log(`[preloadMissionNames] 🔍 RÉCUPÉRATION DB de ${idsToFetch.length} missions`);
    
    const { data, error } = await supabase
      .from('missions')
      .select('id, client, name')
      .in('id', idsToFetch);
      
    if (error) {
      console.error('[preloadMissionNames] ❌ ERREUR:', error);
      return;
    }
    
    // Mettre en cache chaque mission
    if (data && data.length) {
      console.log(`[preloadMissionNames] 📋 ${data.length} missions récupérées de la DB`);
      
      data.forEach(mission => {
        if (!mission.id) return;
        
        const missionId = String(mission.id);
        let finalName = "Sans mission";
        
        // UTILISER EXCLUSIVEMENT LE CHAMP CLIENT en priorité
        if (mission.client && 
            mission.client.trim() !== "" && 
            mission.client !== "null" && 
            mission.client !== "undefined") {
          finalName = mission.client.trim();
          console.log(`[preloadMissionNames] ✅ CLIENT ${missionId}: "${finalName}"`);
        } else if (mission.name && 
                   mission.name.trim() !== "" && 
                   mission.name !== "null" && 
                   mission.name !== "undefined") {
          finalName = mission.name.trim();
          console.log(`[preloadMissionNames] ⚠️ NAME ${missionId}: "${finalName}" (fallback)`);
        } else {
          console.error(`[preloadMissionNames] ❌ AUCUN NOM VALIDE ${missionId}`);
        }
        
        missionNameCache[missionId] = finalName;
      });
      
      console.log(`[preloadMissionNames] ✅ PRÉCHARGEMENT TERMINÉ - ${data.length} missions mises en cache`);
    }
  } catch (err) {
    console.error('[preloadMissionNames] ❌ EXCEPTION:', err);
  }
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
    console.log(`[refreshMissionNameCache] 🔄 Rafraîchissement ${forceAll ? 'complet' : 'sélectif'} démarré`);
    
    if (forceAll) {
      // Vider le cache et re-synchroniser
      await syncKnownMissions();
      return;
    }
    
    // Rafraîchissement sélectif des missions en cache
    const cachedIds = Object.keys(missionNameCache);
    
    if (cachedIds.length > 0) {
      await preloadMissionNames(cachedIds);
    }
    
    console.log(`[refreshMissionNameCache] ✅ Rafraîchissement terminé`);
  } catch (err) {
    console.error('[refreshMissionNameCache] ❌ ERREUR:', err);
  }
};
