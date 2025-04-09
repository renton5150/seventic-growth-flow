
import { Mission } from "../types/types";
import { requests, getRequestsByMissionId } from "./requests";
import { getUserById } from "./users";

// Mock missions
export const missions: Mission[] = [
  {
    id: "mission1",
    name: "Acme Corp",
    client: "Acme Corporation",
    sdrId: "user2",
    createdAt: new Date("2025-03-01"),
    startDate: new Date("2025-03-15"),
    requests: getRequestsByMissionId("mission1"),
  },
  {
    id: "mission2",
    name: "TechStart",
    client: "TechStart Inc",
    sdrId: "user2",
    createdAt: new Date("2025-03-15"),
    startDate: new Date("2025-04-01"),
    requests: getRequestsByMissionId("mission2"),
  },
  {
    id: "mission3",
    name: "Global Finance",
    client: "Global Finance Ltd",
    sdrId: "user2",
    createdAt: new Date("2025-03-20"),
    startDate: new Date("2025-04-05"),
    requests: getRequestsByMissionId("mission3"),
  },
];

// Helper function to get mission by ID
export const getMissionById = (id: string): Mission | undefined => {
  const mission = missions.find((mission) => mission.id === id);
  
  if (!mission) return undefined;
  
  const sdr = getUserById(mission.sdrId);
  
  return {
    ...mission,
    sdrName: sdr?.name || "Inconnu",
    requests: getRequestsByMissionId(mission.id)
  };
};

// Helper function to get missions by user ID
export const getMissionsBySdrId = (sdrId: string): Mission[] => {
  const filteredMissions = missions.filter((mission) => mission.sdrId === sdrId);
  
  return filteredMissions.map(mission => {
    const sdr = getUserById(mission.sdrId);
    return {
      ...mission,
      sdrName: sdr?.name || "Inconnu",
      requests: getRequestsByMissionId(mission.id)
    };
  });
};
