
import { Mission } from "@/types/types";

// Flag to control whether mock data is enabled
export const isMockDataEnabled = false;

// Sample mock missions data
const mockMissions: Mission[] = [
  {
    id: "mock-mission-1",
    name: "Mock Mission 1",
    sdrId: "mock-user-1",
    sdrName: "Mock SDR 1",
    description: "This is a mock mission for testing",
    createdAt: new Date(),
    startDate: new Date(),
    endDate: null,
    type: "Full",
    status: "En cours",
    requests: []
  },
  {
    id: "mock-mission-2",
    name: "Mock Mission 2",
    sdrId: "mock-user-2",
    sdrName: "Mock SDR 2",
    description: "Another mock mission for testing",
    createdAt: new Date(),
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    type: "Part",
    status: "En cours",
    requests: []
  }
];

// Export mock data functions
export const getAllMockMissions = async (): Promise<Mission[]> => {
  return Promise.resolve([...mockMissions]);
};

export const getMockMissionById = async (id: string): Promise<Mission | undefined> => {
  return Promise.resolve(mockMissions.find(mission => mission.id === id));
};

export const getMockMissionsBySdrId = async (sdrId: string): Promise<Mission[]> => {
  return Promise.resolve(mockMissions.filter(mission => mission.sdrId === sdrId));
};

// Alias for backwards compatibility
export const getAllMissions = getAllMockMissions;
