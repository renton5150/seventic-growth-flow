
// User roles
export type UserRole = "admin" | "sdr" | "growth";

// User model
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

// Status for requests
export type RequestStatus = "pending" | "inprogress" | "completed";

// Base request interface
export interface BaseRequest {
  id: string;
  title: string;
  missionId: string;
  createdBy: string;
  createdAt: Date;
  status: RequestStatus;
  dueDate: Date;
  lastUpdated: Date;
  isLate?: boolean;
}

// Email campaign request
export interface EmailCampaignRequest extends BaseRequest {
  type: "email";
  template: {
    content?: string;
    fileUrl?: string;
    webLink?: string;
  };
  database: {
    fileUrl?: string;
    webLink?: string;
    notes?: string;
  };
  blacklist: {
    accounts?: {
      fileUrl?: string;
      notes?: string;
    };
    emails?: {
      fileUrl?: string;
      notes?: string;
    };
  };
  // Added when completed by Growth team
  platform?: "Acelmail" | "Bevo" | "Postyman" | "Direct IQ" | "Mindbaz";
  statistics?: {
    sent: number;
    opened: number;
    clicked: number;
    bounced: number;
  };
}

// Database creation request
export interface DatabaseRequest extends BaseRequest {
  type: "database";
  tool: "Hubspot" | "Apollo";
  targeting: {
    jobTitles?: string[];
    industries?: string[];
    companySize?: string[];
    otherCriteria?: string;
  };
  blacklist: {
    accounts?: {
      fileUrl?: string;
      notes?: string;
    };
    contacts?: {
      fileUrl?: string;
      notes?: string;
    };
  };
  // Added when completed by Growth team
  contactsCreated?: number;
}

// LinkedIn scraping request
export interface LinkedInScrapingRequest extends BaseRequest {
  type: "linkedin";
  targeting: {
    jobTitles?: string[];
    locations?: string[];
    industries?: string[];
    companySize?: string[];
    otherCriteria?: string;
  };
  // Added when completed by Growth team
  profilesScraped?: number;
  resultFileUrl?: string;
}

// Union type for all request types
export type Request = EmailCampaignRequest | DatabaseRequest | LinkedInScrapingRequest;

// Client mission
export interface Mission {
  id: string;
  name: string;
  sdrId: string;
  createdAt: Date;
  requests: Request[];
}

// Mock data type
export interface AppData {
  users: User[];
  missions: Mission[];
  requests: Request[];
}
