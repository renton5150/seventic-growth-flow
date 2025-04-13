
import { Mission, MissionType } from "@/types/types";
import { getMockUser } from "./mockUsers";

// Mock missions data
export const mockMissions: Mission[] = [
  {
    id: "mission1",
    name: "Prospection LinkedIn",
    sdrId: "user1",
    description: "Campagne de prospection sur LinkedIn",
    createdAt: new Date("2023-01-15"),
    sdrName: "John Doe",
    requests: [],
    startDate: new Date("2023-02-01"),
    endDate: new Date("2023-03-15"),
    type: "Full" as MissionType,
    status: "En cours"
  },
  {
    id: "mission2",
    name: "Emailing Secteur Finance",
    sdrId: "user2",
    description: "Campagne d'emailing ciblée",
    createdAt: new Date("2023-02-20"),
    sdrName: "Jane Smith",
    requests: [],
    startDate: new Date("2023-03-01"),
    endDate: null,
    type: "Part" as MissionType,
    status: "En cours"
  }
];
