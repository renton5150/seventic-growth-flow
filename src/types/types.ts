export type RequestStatus = "pending" | "in progress" | "completed" | "canceled";
export type WorkflowStatus = "pending_assignment" | "pending_approval" | "in_progress" | "in_review" | "ready" | "completed" | "canceled";

export interface Request {
  id: string;
  type: string;
  title: string;
  status: RequestStatus;
  createdBy: string;
  missionId: string;
  missionName: string;
  missionClient: string;
  sdrName: string;
  assignedToName: string;
  dueDate: string;
  details: any;
  workflow_status: WorkflowStatus;
  assigned_to: string | null;
  isLate: boolean;
  createdAt: Date;
  lastUpdated: Date;
  target_role: string;
}

export interface EmailCampaignRequest extends Request {
  template: Template;
  database: Database;
  blacklist: Blacklist;
  platform: string;
  statistics: Statistics;
  emailType: string;
}

export interface DatabaseRequest extends Request {
  tool: string;
  targeting: Targeting;
  blacklist: Blacklist;
  contactsCreated: number;
  resultFileUrl: string;
}

export interface LinkedInScrapingRequest extends Request {
  targeting: Targeting;
  profilesScraped?: number;
  resultFileUrl?: string;
}

export interface Template {
  content: string;
  fileUrl: string;
  webLink: string;
  subject: string;
}

export interface Database {
  notes: string;
  fileUrl: string;
  fileUrls: string[];
  webLinks: string[];
  webLink: string; // For backward compatibility
}

export interface BlacklistItem {
  notes: string;
  fileUrl: string;
  fileUrls?: string[]; // Add support for multiple files
}

export interface Blacklist {
  accounts: BlacklistItem;
  emails: BlacklistItem;
}

export interface Targeting {
  jobTitles: string[];
  industries: string[];
  locations: string[];
  companySize: string[];
  otherCriteria: string;
}

export interface Statistics {
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
}

// User and role types
export type UserRole = "admin" | "growth" | "sdr";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt?: Date;
  lastLogin?: Date;
}

// Mission types
export type MissionType = "Full" | "Part" | "Support";
export type MissionStatus = "En cours" | "Fin";

export type TypePrestation = "Call" | "Email marketing" | "Cold email" | "Social selling";

export interface Mission {
  id: string;
  name: string;
  type: MissionType;
  status: MissionStatus;
  sdrId: string;
  sdrName?: string;
  description?: string;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  requests?: Request[];
  objectifMensuelRdv?: string;
  typesPrestation?: TypePrestation[];
  criteresQualification?: string;
  interlocuteursCibles?: string;
  loginConnexion?: string;
  client: string; // Add client property
}

// Additional type aliases for compatibility
export type EmailTemplate = Template;
export type DatabaseDetails = Database;

// App data type
export interface AppData {
  missions: Mission[];
  requests: Request[];
  users: User[];
}
