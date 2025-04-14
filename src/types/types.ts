
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export type UserRole = "admin" | "sdr" | "growth";

export type RequestStatus = "pending" | "inprogress" | "completed" | "rejected";

export interface Request {
  id: string;
  title: string;
  type: "email" | "database" | "linkedin";
  missionId: string;
  missionName?: string | null;
  createdBy: string;
  sdrName?: string;
  createdAt: Date;
  dueDate: Date;
  status: RequestStatus;
  lastUpdated: Date;
  isLate?: boolean;
  statistics?: EmailCampaignStatistics;
  contactsCreated?: number;
  template?: EmailTemplate;
  database?: DatabaseDetails;
  blacklist?: Blacklist;
  targeting?: TargetingCriteria;
  platform?: string;
  profilesScraped?: number;
  resultFileUrl?: string;
}

export interface EmailCampaignRequest extends Request {
  type: "email";
  template: EmailTemplate;
  database?: DatabaseDetails;
  blacklist?: Blacklist;
  platform: string;
  statistics: EmailCampaignStatistics;
}

export interface DatabaseRequest extends Request {
  type: "database";
  tool: string;
  targeting: TargetingCriteria;
  blacklist?: Blacklist;
  contactsCreated?: number;
  otherCriteria?: string;
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
  fileUrl?: string;
  webLink?: string;
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
}

// AppData interface for mock data
export interface AppData {
  users: User[];
  missions: Mission[];
  requests: Request[];
}
