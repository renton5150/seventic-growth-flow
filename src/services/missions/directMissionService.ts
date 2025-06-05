
import { supabase } from "@/integrations/supabase/client";

export interface MissionData {
  id: string;
  name: string;
  client: string;
  sdr_id: string | null;
}

// Service direct et simple - pas de cache, pas de complexité
export const getDirectMissionById = async (missionId: string): Promise<string> => {
  if (!missionId) {
    console.log("[getDirectMissionById] Mission ID vide");
    return "Sans mission";
  }

  try {
    console.log(`[getDirectMissionById] Récupération directe mission ${missionId}`);
    
    const { data, error } = await supabase
      .from('missions')
      .select('id, name, client, sdr_id')
      .eq('id', missionId)
      .single();

    if (error) {
      console.error(`[getDirectMissionById] Erreur Supabase pour ${missionId}:`, error);
      return "Sans mission";
    }

    if (!data) {
      console.warn(`[getDirectMissionById] Aucune mission trouvée pour ${missionId}`);
      return "Sans mission";
    }

    // Logique de nom simple et directe
    let displayName = "Sans mission";
    
    if (data.client && data.client.trim() !== '') {
      displayName = data.client.trim();
    } else if (data.name && data.name.trim() !== '') {
      displayName = data.name.trim();
    }

    console.log(`[getDirectMissionById] Mission ${missionId} -> "${displayName}"`);
    return displayName;
    
  } catch (error) {
    console.error(`[getDirectMissionById] Exception pour ${missionId}:`, error);
    return "Sans mission";
  }
};

// Récupérer toutes les missions directement
export const getAllDirectMissions = async (): Promise<MissionData[]> => {
  try {
    console.log("[getAllDirectMissions] Récupération directe depuis Supabase");
    
    const { data, error } = await supabase
      .from('missions')
      .select('id, name, client, sdr_id')
      .order('name');

    if (error) {
      console.error("[getAllDirectMissions] Erreur Supabase:", error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log("[getAllDirectMissions] Aucune mission trouvée");
      return [];
    }

    const missions = data.map(mission => ({
      id: mission.id,
      name: mission.name || "",
      client: mission.client || "",
      sdr_id: mission.sdr_id
    }));

    console.log(`[getAllDirectMissions] ${missions.length} missions récupérées:`, missions);
    return missions;
    
  } catch (error) {
    console.error("[getAllDirectMissions] Exception:", error);
    return [];
  }
};

// Récupérer les missions pour un utilisateur SDR
export const getDirectMissionsForUser = async (userId: string): Promise<MissionData[]> => {
  const allMissions = await getAllDirectMissions();
  return allMissions.filter(mission => mission.sdr_id === userId);
};

// Fonction pour obtenir le nom d'affichage d'une mission
export const getDirectMissionDisplayName = (mission: MissionData): string => {
  if (mission.client && mission.client.trim() !== '') {
    return mission.client.trim();
  }
  
  if (mission.name && mission.name.trim() !== '') {
    return mission.name.trim();
  }
  
  return "Sans nom";
};
