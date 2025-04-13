export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "sdr";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GrowthDashboardData {
  totalMissions: number;
  activeMissions: number;
  completedMissions: number;
  totalSDRs: number;
}

export interface DashboardRequest {
  id: string;
  type: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: Date;
}

export type MissionType = "Full" | "Part";
export type MissionStatus = "En cours" | "Terminé";

export interface Mission {
  id: string;
  name: string;
  description?: string;
  sdrId: string;
  sdrName?: string;
  startDate: Date | null;
  endDate: Date | null;
  type: MissionType;
  status: MissionStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

// On réexporte également les types du formulaire de mission pour compatibilité
export type { MissionFormValues } from "@/components/missions/schemas/missionFormSchema";
