
export type UserRole = "admin" | "sdr" | "growth";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
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
  requests?: Request[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Types pour les requêtes
export type RequestStatus = "pending" | "inprogress" | "completed";

export interface Request {
  id: string;
  type: string;
  title: string;
  missionId: string;
  createdBy: string;
  createdAt: Date;
  status: RequestStatus;
  dueDate: Date;
  lastUpdated: Date;
  isLate?: boolean;
  template?: {
    content?: string;
    webLink?: string;
  };
  database?: {
    notes?: string;
  };
  blacklist?: {
    accounts?: { notes: string };
    emails?: { notes: string };
  };
  platform?: string;
  statistics?: {
    sent?: number;
    opened?: number;
    clicked?: number;
    bounced?: number;
  };
  targeting?: {
    jobTitles?: string[];
    industries?: string[];
    companySize?: string[];
    locations?: string[];
    otherCriteria?: string;
  };
  tool?: string;
  contactsCreated?: number;
}

export interface EmailCampaignRequest extends Request {
  type: "email";
  template: {
    content?: string;
    webLink?: string;
  };
  database: {
    notes: string;
  };
  blacklist?: {
    accounts?: { notes: string };
    emails?: { notes: string };
  };
  platform?: string;
  statistics?: {
    sent?: number;
    opened?: number;
    clicked?: number;
    bounced?: number;
  };
}

export interface DatabaseRequest extends Request {
  type: "database";
  tool: string;
  targeting: {
    jobTitles: string[];
    industries: string[];
    companySize: string[];
    otherCriteria?: string;
  };
  blacklist: {
    accounts: { notes: string };
  };
  contactsCreated?: number;
}

export interface LinkedInScrapingRequest extends Request {
  type: "linkedin";
  targeting: {
    jobTitles: string[];
    locations?: string[];
    industries: string[];
    companySize: string[];
  };
}

// Interface pour l'ensemble des données de l'application
export interface AppData {
  users: User[];
  missions: Mission[];
  requests: Request[];
}

// On réexporte également les types du formulaire de mission pour compatibilité
export type { MissionFormValues } from "@/components/missions/schemas/missionFormSchema";
