
import { v4 as uuidv4 } from 'uuid';
import { mockData } from "@/data/mockData";
import { Mission } from "@/types/types";

// Get all missions
export const getAllMissions = (): Mission[] => {
  // Extract SDR names and add them to missions
  const missionsWithSdrNames = mockData.missions.map(mission => {
    const sdr = mockData.users.find(user => user.id === mission.sdrId);
    return {
      ...mission,
      sdrName: sdr?.name || "Inconnu",
      // Fetch associated requests
      requests: mockData.requests.filter(request => request.missionId === mission.id)
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
      sdrName: mockData.users.find(user => user.id === mission.sdrId)?.name || "Inconnu",
      // Fetch associated requests
      requests: mockData.requests.filter(request => request.missionId === mission.id)
    };
  });
  
  return missionsWithRequests;
};

// Get a mission by ID
export const getMissionById = (missionId: string): Mission | undefined => {
  const mission = mockData.missions.find(mission => mission.id === missionId);
  
  if (!mission) return undefined;
  
  const sdr = mockData.users.find(user => user.id === mission.sdrId);
  
  return {
    ...mission,
    sdrName: sdr?.name || "Inconnu",
    requests: mockData.requests.filter(request => request.missionId === mission.id)
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
    sdrName: mockData.users.find(user => user.id === data.sdrId)?.name || "Inconnu"
  };
};
