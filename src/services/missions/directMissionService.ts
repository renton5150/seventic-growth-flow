
import { supabase } from "@/integrations/supabase/client";

export interface MissionData {
  id: string;
  name: string;
  client: string;
  sdr_id: string | null;
}

// Service ULTRA SIMPLE et direct pour résoudre les problèmes de format
export const getDirectMissionById = async (missionId: string): Promise<{ name: string; client: string }> => {
  if (!missionId) {
    console.log("[getDirectMissionById] Mission ID vide");
    return { name: "Sans mission", client: "Sans client" };
  }

  try {
    console.log(`[getDirectMissionById] Récupération DIRECTE mission ${missionId}`);
    
    const { data, error } = await supabase
      .from('missions')
      .select('id, name, client, sdr_id')
      .eq('id', missionId)
      .maybeSingle(); // Utiliser maybeSingle au lieu de single pour éviter les erreurs

    if (error) {
      console.error(`[getDirectMissionById] Erreur Supabase pour ${missionId}:`, error);
      return { name: "Sans mission", client: "Sans client" };
    }

    if (!data) {
      console.warn(`[getDirectMissionById] Aucune mission trouvée pour ${missionId}`);
      return { name: "Sans mission", client: "Sans client" };
    }

    // Retourner à la fois le nom et le client
    const missionName = data.name && data.name.trim() !== '' ? data.name.trim() : "Sans nom";
    const missionClient = data.client && data.client.trim() !== '' ? data.client.trim() : "Sans client";

    console.log(`[getDirectMissionById] Mission ${missionId} -> nom: "${missionName}", client: "${missionClient}"`);
    return { name: missionName, client: missionClient };
    
  } catch (error) {
    console.error(`[getDirectMissionById] Exception pour ${missionId}:`, error);
    return { name: "Sans mission", client: "Sans client" };
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

// Fonction pour obtenir le nom d'affichage d'une mission (priorité au client)
export const getDirectMissionDisplayName = (mission: MissionData): string => {
  if (mission.client && mission.client.trim() !== '') {
    return mission.client.trim();
  }
  
  if (mission.name && mission.name.trim() !== '') {
    return mission.name.trim();
  }
  
  return "Sans nom";
};
