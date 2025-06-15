
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export type UserRole = "admin" | "sdr" | "growth";

export type RequestStatus = "pending" | "inprogress" | "completed" | "rejected";
export type WorkflowStatus = "pending_assignment" | "in_progress" | "completed" | "canceled";

export interface Request {
  id: string;
  title: string;
  type: string;
  status: RequestStatus;
  createdBy?: string | null;
  missionId?: string | null;
  missionName: string;
  missionClient: string; // NOUVELLE PROPRIÉTÉ pour le client de mission
  sdrName: string;
  assignedToName: string;
  dueDate: string; // CHANGÉ: string au lieu de Date
  details: Record<string, any>;
  workflow_status: WorkflowStatus;
  assigned_to?: string | null;
  isLate: boolean;
  createdAt: Date;
  lastUpdated: Date;
  target_role?: string | null;
}

export interface EmailCampaignRequest extends Request {
  type: "email";
  template: EmailTemplate;
  database?: DatabaseDetails;
  blacklist?: Blacklist;
  platform: string;
  statistics: EmailCampaignStatistics;
  emailType: "Mass email" | "Cold email";
}

export interface DatabaseRequest extends Request {
  type: "database";
  tool: string;
  targeting: TargetingCriteria;
  blacklist?: Blacklist;
  contactsCreated?: number;
  otherCriteria?: string;
  resultFileUrl?: string;
}

export interface LinkedInScrapingRequest extends Request {
  type: "linkedin";
  targeting: TargetingCriteria;
  profilesScraped?: number;
  resultFileUrl?: string;
}

export interface EmailTemplate {
  subject?: string;
  content: string;
  webLink?: string;
  fileUrl?: string;
}

export interface DatabaseDetails {
  notes: string;
  fileUrl?: string; // Maintenu pour la rétrocompatibilité
  fileUrls?: string[]; // Nouveau champ pour les fichiers multiples
  webLink?: string;
  webLinks?: string[];
}

export interface Blacklist {
  accounts?: { 
    notes: string;
    fileUrl?: string;
  };
  emails?: { 
    notes: string;
    fileUrl?: string;
  };
  contacts?: {
    notes: string;
    fileUrl?: string;
  };
}

export interface TargetingCriteria {
  jobTitles: string[];
  locations?: string[];
  industries: string[];
  companySize: string[];
  otherCriteria?: string;
}

export interface EmailCampaignStatistics {
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
}

export type MissionType = "Full" | "Part";
export type TypePrestation = "Call" | "Email marketing" | "Cold email" | "Social selling";

export interface Mission {
  id: string;
  name: string;
  sdrId: string;
  sdrName?: string;
  description?: string;
  createdAt: Date;
  startDate: Date | null;
  endDate: Date | null;
  type: MissionType;
  status: "En cours" | "Fin";
  requests: Request[];
  client?: string; // Added client property as it's used in the code but wasn't in the type
  // Nouveaux champs
  objectifMensuelRdv?: string;
  typesPrestation?: TypePrestation[];
  criteresQualification?: string;
  interlocuteursCibles?: string;
  loginConnexion?: string;
}

export interface AppData {
  users: User[];
  missions: Mission[];
  requests: Request[];
}
