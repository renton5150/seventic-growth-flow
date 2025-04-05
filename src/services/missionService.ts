
import { v4 as uuidv4 } from 'uuid';
import { mockData } from "@/data/mockData";
import { Mission } from "@/types/types";
import { getUserById } from "@/data/users";
import { getRequestsByMissionId } from "@/data/requests";

// Get all missions
export const getAllMissions = (): Mission[] => {
  // Extract SDR names and add them to missions
  const missionsWithSdrNames = mockData.missions.map(mission => {
    const sdr = getUserById(mission.sdrId);
    return {
      ...mission,
      sdrName: sdr?.name || "Inconnu",
      // Fetch associated requests
      requests: getRequestsByMissionId(mission.id)
    };
  });
  
  return missionsWithSdrNames;
};

// Get missions by SDR ID
export const getMissionsByUserId = (userId: string): Mission[] => {
  const missions = mockData.missions.filter(mission => mission.sdrId === userId);
  
  const missionsWithRequests = missions.map(mission => {
    return {
      ...mission,
      sdrName: getUserById(mission.sdrId)?.name || "Inconnu",
      // Fetch associated requests
      requests: getRequestsByMissionId(mission.id)
    };
  });
  
  return missionsWithRequests;
};

// Get a mission by ID
export const getMissionById = (missionId: string): Mission | undefined => {
  const mission = mockData.missions.find(mission => mission.id === missionId);
  
  if (!mission) return undefined;
  
  const sdr = getUserById(mission.sdrId);
  
  return {
    ...mission,
    sdrName: sdr?.name || "Inconnu",
    requests: getRequestsByMissionId(mission.id)
  };
};

// Create a new mission
export const createMission = (data: {
  name: string;
  client: string;
  description?: string;
  sdrId: string;
}): Mission => {
  const newMission: Mission = {
    id: uuidv4(),
    name: data.name,
    client: data.client,
    description: data.description,
    sdrId: data.sdrId,
    createdAt: new Date(),
    requests: []
  };
  
  mockData.missions.push(newMission);
  
  return {
    ...newMission,
    sdrName: getUserById(data.sdrId)?.name || "Inconnu"
  };
};
