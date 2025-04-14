
import { Mission } from "../types/types";
import { requests, getRequestsByMissionId } from "./requests";
import { getUserById } from "./users";

// Mock missions
export const missions: Mission[] = [
  {
    id: "mission1",
    name: "Acme Corp",
    sdrId: "user2",
    createdAt: new Date("2025-03-01"),
    requests: getRequestsByMissionId("mission1"),
    startDate: new Date("2025-03-01"),
    endDate: new Date("2025-05-31"),
    type: "Full",
    status: "En cours"
  },
  {
    id: "mission2",
    name: "TechStart",
    sdrId: "user2",
    createdAt: new Date("2025-03-15"),
    requests: getRequestsByMissionId("mission2"),
    startDate: new Date("2025-03-15"),
    endDate: null,
    type: "Part",
    status: "En cours"
  },
  {
    id: "mission3",
    name: "Global Finance",
    sdrId: "user2",
    createdAt: new Date("2025-03-20"),
    requests: getRequestsByMissionId("mission3"),
    startDate: new Date("2025-03-20"),
    endDate: new Date("2025-12-31"),
    type: "Full",
    status: "En cours"
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
