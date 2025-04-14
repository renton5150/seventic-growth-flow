export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "sdr" | "growth";
  avatar?: string;
}

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
  status: "pending" | "inprogress" | "completed" | "rejected";
  lastUpdated: Date;
  isLate?: boolean;
  statistics?: EmailCampaignStatistics;
  contactsCreated?: number;
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
}

export interface EmailTemplate {
  subject?: string;
  content: string;
  webLink?: string;
}

export interface DatabaseDetails {
  notes: string;
}

export interface Blacklist {
  accounts?: { notes: string };
  emails?: { notes: string };
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
