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
