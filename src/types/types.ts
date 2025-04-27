
export type MissionType = "Full" | "Part";
export type MissionStatus = "En cours" | "Fin";

export type RequestStatus = "pending" | "in_progress" | "completed" | "canceled";
export type RequestType = "database" | "linkedin" | "email";
export type WorkflowStatus = "pending_assignment" | "assigned" | "in_progress" | "review" | "completed";
export type UserRole = "admin" | "user" | "sdr" | "growth";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Comment {
  id?: string;
  text: string;
  userId: string;
  userName?: string;
  date: Date | string;
}

export interface Mission {
  id: string;
  name: string;
  client?: string;
  description?: string;
  sdrId?: string;
  sdrName?: string;
  createdAt: Date | null;
  updatedAt?: Date | null;
  startDate: Date | null;
  endDate: Date | null;
  type: MissionType;
  status: MissionStatus;
  requests?: Request[];
}

export interface Request {
  id: string;
  title: string;
  type: RequestType;
  status: RequestStatus;
  created_at: string | Date;
  updated_at?: string | Date;
  created_by?: string;
  created_by_name?: string;
  missionId?: string;
  missionName?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  target_role?: string;
  due_date: string | Date;
  last_updated: string | Date;
  workflow_status?: WorkflowStatus;
  details?: any;
  comments?: Comment[];
  
  // Additional properties needed based on errors
  createdAt?: string | Date; // Alias for created_at
  createdBy?: string; // Alias for created_by
  dueDate?: string | Date; // Alias for due_date
  lastUpdated?: string | Date; // Alias for last_updated
  assignedToName?: string; // Alias for assigned_to_name
  sdrName?: string;
  isLate?: boolean;
  targeting?: any;
  template?: any;
}

export interface EmailCampaignRequest extends Request {
  details: {
    title: string;
    content?: string;
    subject?: string;
    targetAudience?: string;
    callToAction?: string;
    objectives?: string;
    additionalNotes?: string;
    attachedFiles?: string[];
    results?: {
      emailsSent?: number;
      openRate?: number;
      clickRate?: number;
      conversions?: number;
      fileUrl?: string;
    };
  };
}

export interface DatabaseRequest extends Request {
  details: {
    targeting: {
      industries?: string[];
      companySize?: string;
      locations?: string[];
      jobTitles?: string[];
      seniority?: string[];
    };
    format?: string;
    fieldsNeeded?: string[];
    additionalNotes?: string;
    results?: {
      contactsCount?: number;
      companiesCount?: number;
      fileUrl?: string;
    };
  };
  // Additional properties for backward compatibility
  tool?: string;
  blacklist?: any;
  contactsCreated?: number;
  resultFileUrl?: string;
}

export interface LinkedInScrapingRequest extends Request {
  details: {
    targeting?: {
      jobTitles?: string[];
      industries?: string[];
      locations?: string[];
      companySize?: string;
      seniority?: string[];
    };
    additionalNotes?: string;
    results?: {
      profilesFound?: number;
      fileUrl?: string;
    };
  };
}

// Additional types needed for email campaign components
export interface EmailTemplate {
  content?: string;
  webLink?: string;
  fileUrl?: string;
}

export interface DatabaseDetails {
  notes?: string;
  webLink?: string;
  fileUrl?: string;
}

export interface BlacklistFile {
  notes?: string;
  fileUrl?: string;
}

export interface Blacklist {
  accounts?: BlacklistFile;
  emails?: BlacklistFile;
}

// App data type for mock data
export interface AppData {
  missions: Mission[];
  requests: Request[];
  users: User[];
}
