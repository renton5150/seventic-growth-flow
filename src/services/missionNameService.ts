
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

// Fonction pour vider le cache
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

// Fonction pour synchroniser avec la base de données réelle
export const syncKnownMissions = async (): Promise<void> => {
  try {
    console.log("[syncKnownMissions] DÉMARRAGE - Synchronisation complète depuis la base");
    
    // Vider complètement le cache pour repartir à zéro
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
      
      // Freshworks TOUJOURS prioritaire - ne pas écraser
      if (isFreshworksId(missionId)) {
        console.log(`[syncKnownMissions] FRESHWORKS confirmé: ${missionId}`);
        return;
      }
      
      // CORRECTION CRITIQUE: Utiliser EXCLUSIVEMENT le champ CLIENT
      let finalName = "Sans mission";
      
      if (mission.client && 
          mission.client.trim() !== "" && 
          mission.client !== "null" && 
          mission.client !== "undefined" &&
          !mission.client.startsWith("Mission ")) {
        finalName = mission.client.trim();
        console.log(`[syncKnownMissions] ✅ Mission ${missionId}: CLIENT="${finalName}"`);
      } else if (mission.name && 
                 mission.name.trim() !== "" && 
                 mission.name !== "null" && 
                 mission.name !== "undefined" &&
                 !mission.name.startsWith("Mission ")) {
        finalName = mission.name.trim();
        console.log(`[syncKnownMissions] ⚠️ Mission ${missionId}: NAME="${finalName}" (fallback)`);
      } else {
        console.error(`[syncKnownMissions] ❌ Mission ${missionId}: AUCUNE VALEUR VALIDE - client="${mission.client}", name="${mission.name}"`);
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
    // Même en cas d'erreur, assurer Freshworks
    missionNameCache[FRESHWORKS_PRIMARY_ID] = "Freshworks";
    missionNameCache[FRESHWORKS_SECONDARY_ID] = "Freshworks";
  }
};

/**
 * Fonction principale TOTALEMENT REVUE pour obtenir un nom de mission
 * PLUS JAMAIS de noms techniques générés automatiquement
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
  
  // FRESHWORKS - retour immédiat, ne jamais interroger la base
  if (isFreshworksId(missionIdStr)) {
    console.log(`[getMissionName] ✅ FRESHWORKS détecté: ${missionIdStr} => "Freshworks"`);
    missionNameCache[missionIdStr] = "Freshworks";
    return "Freshworks";
  }
  
  // Vérifier le cache SEULEMENT si pas de force refresh et que la valeur est valide
  const cachedValue = missionNameCache[missionIdStr];
  if (!options?.forceRefresh && cachedValue) {
    // Vérifier que la valeur en cache n'est pas technique
    if (cachedValue !== "Sans mission" && !cachedValue.startsWith("Mission ")) {
      console.log(`[getMissionName] ✅ CACHE VALIDE pour ${missionIdStr}: "${cachedValue}"`);
      return cachedValue;
    } else {
      console.warn(`[getMissionName] ⚠️ CACHE INVALIDE pour ${missionIdStr}: "${cachedValue}" - Interrogation DB`);
    }
  }
  
  try {
    console.log(`[getMissionName] 🔍 INTERROGATION DB pour ${missionIdStr}`);
    
    // Interroger la base de données
    const { data, error } = await supabase
      .from('missions')
      .select('id, name, client')
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
      
      // PRIORITÉ ABSOLUE AU CLIENT si ce n'est pas technique
      if (data.client && 
          data.client.trim() !== "" && 
          data.client !== "null" && 
          data.client !== "undefined" &&
          !data.client.startsWith("Mission ")) {
        finalName = data.client.trim();
        console.log(`[getMissionName] ✅ CLIENT DB pour ${missionIdStr}: "${finalName}"`);
      }
      // Sinon NAME si ce n'est pas technique
      else if (data.name && 
               data.name.trim() !== "" && 
               data.name !== "null" && 
               data.name !== "undefined" &&
               !data.name.startsWith("Mission ")) {
        finalName = data.name.trim();
        console.log(`[getMissionName] ⚠️ NAME DB pour ${missionIdStr}: "${finalName}" (fallback)`);
      }
      else {
        console.error(`[getMissionName] ❌ DONNÉES DB INVALIDES pour ${missionIdStr} - client="${data.client}", name="${data.name}"`);
      }
    } else {
      console.warn(`[getMissionName] ⚠️ AUCUNE DONNÉE DB pour ${missionIdStr}`);
    }
    
    // Utiliser les fallbacks SEULEMENT si pas de données DB valides ET que les fallbacks ne sont pas techniques
    if (finalName === "Sans mission") {
      if (options?.fallbackClient && 
          options.fallbackClient.trim() !== "" &&
          options.fallbackClient !== "null" && 
          options.fallbackClient !== "undefined" &&
          !options.fallbackClient.startsWith("Mission ")) {
        finalName = options.fallbackClient.trim();
        console.log(`[getMissionName] 🔄 FALLBACK CLIENT pour ${missionIdStr}: "${finalName}"`);
      }
      else if (options?.fallbackName && 
               options.fallbackName.trim() !== "" &&
               options.fallbackName !== "null" && 
               options.fallbackName !== "undefined" &&
               !options.fallbackName.startsWith("Mission ")) {
        finalName = options.fallbackName.trim();
        console.log(`[getMissionName] 🔄 FALLBACK NAME pour ${missionIdStr}: "${finalName}"`);
      }
    }
    
    // PLUS JAMAIS de noms techniques générés automatiquement
    console.log(`[getMissionName] ✅ RÉSULTAT FINAL pour ${missionIdStr}: "${finalName}"`);
    missionNameCache[missionIdStr] = finalName;
    return finalName;
    
  } catch (err) {
    console.error(`[getMissionName] ❌ EXCEPTION pour ${missionIdStr}:`, err);
    
    // En cas d'erreur, utiliser les fallbacks valides ou retourner "Sans mission"
    if (isFreshworksId(missionIdStr)) {
      return "Freshworks";
    }
    
    if (options?.fallbackClient && 
        options.fallbackClient.trim() !== "" &&
        !options.fallbackClient.startsWith("Mission ")) {
      console.log(`[getMissionName] 🔄 EXCEPTION FALLBACK CLIENT: "${options.fallbackClient}"`);
      return options.fallbackClient.trim();
    }
    if (options?.fallbackName && 
        options.fallbackName.trim() !== "" &&
        !options.fallbackName.startsWith("Mission ")) {
      console.log(`[getMissionName] 🔄 EXCEPTION FALLBACK NAME: "${options.fallbackName}"`);
      return options.fallbackName.trim();
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
  
  // Traitement spécial pour Freshworks
  const hasFreshworks = missionIds.some(id => isFreshworksId(id));
  if (hasFreshworks) {
    missionNameCache[FRESHWORKS_PRIMARY_ID] = "Freshworks";
    missionNameCache[FRESHWORKS_SECONDARY_ID] = "Freshworks";
    console.log(`[preloadMissionNames] ✅ Freshworks détecté et forcé`);
  }
  
  // Filtrer les IDs à récupérer (pas en cache ou valeur technique)
  const idsToFetch = missionIds.filter(id => {
    if (isFreshworksId(id)) return false;
    const cached = missionNameCache[id];
    const needsFetch = !cached || cached === "Sans mission" || cached.startsWith("Mission ");
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
      .select('id, name, client')
      .in('id', idsToFetch);
      
    if (error) {
      console.error('[preloadMissionNames] ❌ ERREUR:', error);
      return;
    }
    
    // Mettre en cache chaque mission avec la logique corrigée
    if (data && data.length) {
      console.log(`[preloadMissionNames] 📋 ${data.length} missions récupérées de la DB`);
      
      data.forEach(mission => {
        if (!mission.id) return;
        
        const missionId = String(mission.id);
        
        // Freshworks check
        if (isFreshworksId(missionId)) {
          missionNameCache[missionId] = "Freshworks";
          console.log(`[preloadMissionNames] ✅ Freshworks: ${missionId}`);
          return;
        }
        
        let finalName = "Sans mission";
        
        // PRIORITÉ ABSOLUE AU CLIENT si valide
        if (mission.client && 
            mission.client.trim() !== "" && 
            mission.client !== "null" && 
            mission.client !== "undefined" &&
            !mission.client.startsWith("Mission ")) {
          finalName = mission.client.trim();
          console.log(`[preloadMissionNames] ✅ CLIENT ${missionId}: "${finalName}"`);
        }
        // Sinon NAME si valide
        else if (mission.name && 
                mission.name.trim() !== "" && 
                mission.name !== "null" && 
                mission.name !== "undefined" &&
                !mission.name.startsWith("Mission ")) {
          finalName = mission.name.trim();
          console.log(`[preloadMissionNames] ⚠️ NAME ${missionId}: "${finalName}" (fallback)`);
        }
        else {
          console.error(`[preloadMissionNames] ❌ DONNÉES INVALIDES ${missionId}: client="${mission.client}", name="${mission.name}"`);
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
 * Force Freshworks dans le cache
 */
export const forceRefreshFreshworks = (): void => {
  missionNameCache[FRESHWORKS_PRIMARY_ID] = "Freshworks";
  missionNameCache[FRESHWORKS_SECONDARY_ID] = "Freshworks";
  console.log(`[forceRefreshFreshworks] ✅ Freshworks forcé`);
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
    const cachedIds = Object.keys(missionNameCache).filter(id => !isFreshworksId(id));
    
    if (cachedIds.length > 0) {
      await preloadMissionNames(cachedIds);
    }
    
    console.log(`[refreshMissionNameCache] ✅ Rafraîchissement terminé`);
  } catch (err) {
    console.error('[refreshMissionNameCache] ❌ ERREUR:', err);
    // Garantir Freshworks même en cas d'erreur
    missionNameCache[FRESHWORKS_PRIMARY_ID] = "Freshworks";
    missionNameCache[FRESHWORKS_SECONDARY_ID] = "Freshworks";
  }
};
