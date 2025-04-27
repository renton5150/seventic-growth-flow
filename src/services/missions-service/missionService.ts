
import { v4 as uuidv4 } from "uuid";
import { Mission } from "@/types/types";
import { deleteSupabaseMission, createSupabaseMission, updateSupabaseMission } from "./operations/writeMissions";
import { getAllMissionsFromSupabase, getMissionById, getMissionsByGrowthId, getMissionsBySdrId, getMissionsByUserId } from "./operations/readMissions";
import { createMockedMission } from "./mockMissions";

// Create a new mission (auto-detects backend source)
export const createMission = async (data: {
  name: string;
  sdrId?: string;
  description?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  type?: string;
}): Promise<Mission | undefined> => {
  try {
    console.log("Creating new mission:", data);
    
    // Vérifier et nettoyer les données
    if (!data.name || data.name.trim() === '') {
      throw new Error("Le nom est requis pour créer une mission");
    }

    // Si l'environnement supporte Supabase, utiliser l'API Supabase
    const mission = await createSupabaseMission({
      name: data.name,
      sdrId: data.sdrId || "",
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      type: data.type
    });
    
    if (mission) {
      console.log("Mission successfully created in Supabase:", mission);
      return mission;
    } else {
      // En cas d'échec de Supabase, essayer la création de mission simulée
      console.log("Falling back to mock mission creation");
      return createMockedMission({
        name: data.name,
        sdrId: data.sdrId || "",
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        type: data.type
      });
    }
  } catch (error) {
    console.error("Error creating mission:", error);
    throw error;
  }
};

// Update an existing mission
export const updateMission = async (data: {
  id: string;
  name: string;
  sdrId?: string;
  description?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  type?: string;
  status?: "En cours" | "Fin";
}): Promise<Mission | undefined> => {
  try {
    console.log("Updating mission:", data);
    
    if (!data.id) {
      throw new Error("Mission ID is required to update a mission");
    }
    
    const mission = await updateSupabaseMission({
      id: data.id,
      name: data.name,
      sdrId: data.sdrId || "",
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      type: data.type || "Full",
      status: data.status || "En cours"
    });
    
    if (mission) {
      console.log("Mission successfully updated in Supabase:", mission);
      return mission;
    } else {
      console.warn("Mission update failed, no data returned");
      return undefined;
    }
  } catch (error) {
    console.error("Error updating mission:", error);
    throw error;
  }
};

// Delete a mission
export const deleteMission = async (missionId: string): Promise<boolean> => {
  try {
    console.log("Deleting mission with ID:", missionId);
    
    if (!missionId) {
      throw new Error("Mission ID is required to delete a mission");
    }
    
    const success = await deleteSupabaseMission(missionId);
    
    if (success) {
      console.log("Mission successfully deleted in Supabase");
      return true;
    } else {
      console.warn("Mission deletion failed");
      return false;
    }
  } catch (error) {
    console.error("Error deleting mission:", error);
    throw error;
  }
};

// Get all missions
export const getAllMissions = async (): Promise<Mission[]> => {
  try {
    console.log("Fetching all missions");
    
    const missions = await getAllMissionsFromSupabase();
    
    console.log(`Successfully fetched ${missions.length} missions`);
    return missions;
  } catch (error) {
    console.error("Error fetching all missions:", error);
    throw error;
  }
};

// Get a mission by ID
export const getMission = async (id: string): Promise<Mission | undefined> => {
  try {
    console.log(`Fetching mission with ID: ${id}`);
    
    if (!id) {
      throw new Error("Mission ID is required to get a mission");
    }
    
    const mission = await getMissionById(id);
    
    if (mission) {
      console.log("Mission found:", mission);
      return mission;
    } else {
      console.warn("Mission not found");
      return undefined;
    }
  } catch (error) {
    console.error(`Error fetching mission with ID ${id}:`, error);
    throw error;
  }
};

// Get missions by SDR ID
export const getMissionsBySdr = async (sdrId: string): Promise<Mission[]> => {
  try {
    console.log(`Fetching missions by SDR ID: ${sdrId}`);
    
    if (!sdrId) {
      throw new Error("SDR ID is required to get missions by SDR");
    }
    
    const missions = await getMissionsBySdrId(sdrId);
    
    console.log(`Successfully fetched ${missions.length} missions for SDR ID ${sdrId}`);
    return missions;
  } catch (error) {
    console.error(`Error fetching missions by SDR ID ${sdrId}:`, error);
    throw error;
  }
};

// Get missions by Growth ID
export const getMissionsByGrowth = async (growthId: string): Promise<Mission[]> => {
  try {
    console.log(`Fetching missions by Growth ID: ${growthId}`);
    
    if (!growthId) {
      throw new Error("Growth ID is required to get missions by Growth");
    }
    
    const missions = await getMissionsByGrowthId(growthId);
    
    console.log(`Successfully fetched ${missions.length} missions for Growth ID ${growthId}`);
    return missions;
  } catch (error) {
    console.error(`Error fetching missions by Growth ID ${growthId}:`, error);
    throw error;
  }
};
