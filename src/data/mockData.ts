
import { AppData, User, Mission, Request, EmailCampaignRequest, LinkedInScrapingRequest, DatabaseRequest } from "../types/types";

// Mock users
const users: User[] = [
  {
    id: "user1",
    email: "admin@seventic.com",
    name: "Admin User",
    role: "admin",
    avatar: "https://ui-avatars.com/api/?name=Admin+User&background=7E69AB&color=fff",
  },
  {
    id: "user2",
    email: "sdr@seventic.com",
    name: "Sales Representative",
    role: "sdr",
    avatar: "https://ui-avatars.com/api/?name=Sales+Representative&background=7E69AB&color=fff",
  },
  {
    id: "user3",
    email: "growth@seventic.com",
    name: "Growth Manager",
    role: "growth",
    avatar: "https://ui-avatars.com/api/?name=Growth+Manager&background=7E69AB&color=fff",
  },
];

// Mock requests first so we can reference them in missions
const requests: Request[] = [
  {
    id: "request1",
    type: "email",
    title: "Product Launch Campaign",
    missionId: "mission1",
    createdBy: "user2",
    createdAt: new Date("2025-03-05"),
    status: "completed",
    dueDate: new Date("2025-03-10"),
    lastUpdated: new Date("2025-03-08"),
    template: {
      content: "<h1>Product Launch</h1><p>We're excited to announce...</p>",
    },
    database: {
      notes: "Use the marketing contacts database",
    },
    blacklist: {
      accounts: { notes: "Exclude competitors" },
      emails: { notes: "Exclude past unsubscribes" },
    },
    platform: "Acelmail",
    statistics: {
      sent: 5000,
      opened: 1250,
      clicked: 450,
      bounced: 50,
    },
  } as EmailCampaignRequest,
  {
    id: "request2",
    type: "database",
    title: "CRM Setup",
    missionId: "mission1",
    createdBy: "user2",
    createdAt: new Date("2025-03-06"),
    status: "inprogress",
    dueDate: new Date("2025-03-15"),
    lastUpdated: new Date("2025-03-12"),
    tool: "Hubspot",
    targeting: {
      jobTitles: ["CTO", "VP Engineering", "Technical Director"],
      industries: ["Software", "IT Services"],
      companySize: ["50-200", "201-500"],
    },
    blacklist: {
      accounts: { notes: "Exclude direct competitors" },
    },
  } as DatabaseRequest,
  {
    id: "request3",
    type: "linkedin",
    title: "Startup Founders Scraping",
    missionId: "mission2",
    createdBy: "user2",
    createdAt: new Date("2025-03-16"),
    status: "pending",
    dueDate: new Date("2025-04-10"),
    lastUpdated: new Date("2025-03-16"),
    targeting: {
      jobTitles: ["Founder", "CEO", "Co-Founder"],
      locations: ["Paris", "Lyon", "Bordeaux"],
      industries: ["SaaS", "Fintech", "Health Tech"],
      companySize: ["1-10", "11-50"],
    },
  } as LinkedInScrapingRequest,
  {
    id: "request4",
    type: "email",
    title: "Financial Services Newsletter",
    missionId: "mission3",
    createdBy: "user2",
    createdAt: new Date("2025-03-22"),
    status: "pending",
    dueDate: new Date("2025-03-26"),
    lastUpdated: new Date("2025-03-22"),
    template: {
      webLink: "https://docs.google.com/document/d/financial-template",
    },
    database: {
      notes: "Use financial sector contacts",
    },
    blacklist: {
      emails: { notes: "Exclude people who unsubscribed from previous campaigns" },
    },
    isLate: true,
  } as EmailCampaignRequest,
  {
    id: "request5",
    type: "database",
    title: "Banking Executives",
    missionId: "mission3",
    createdBy: "user2",
    createdAt: new Date("2025-03-23"),
    status: "completed",
    dueDate: new Date("2025-03-30"),
    lastUpdated: new Date("2025-03-28"),
    tool: "Apollo",
    targeting: {
      jobTitles: ["CFO", "Financial Director", "Controller"],
      industries: ["Banking", "Financial Services", "Insurance"],
      companySize: ["500+"],
      otherCriteria: "Focus on companies with over €50M annual revenue",
    },
    blacklist: {
      accounts: { notes: "No specific exclusions" },
    },
    contactsCreated: 357,
  } as DatabaseRequest,
];

// Mock missions
const missions: Mission[] = [
  {
    id: "mission1",
    name: "Acme Corp",
    sdrId: "user2",
    createdAt: new Date("2025-03-01"),
    requests: [requests[0], requests[1]],
  },
  {
    id: "mission2",
    name: "TechStart",
    sdrId: "user2",
    createdAt: new Date("2025-03-15"),
    requests: [requests[2]],
  },
  {
    id: "mission3",
    name: "Global Finance",
    sdrId: "user2",
    createdAt: new Date("2025-03-20"),
    requests: [requests[3], requests[4]],
  },
];

export const mockData: AppData = {
  users,
  missions,
  requests,
};

// Helper function to get user by ID
export const getUserById = (id: string): User | undefined => {
  return mockData.users.find((user) => user.id === id);
};

// Helper function to get mission by ID
export const getMissionById = (id: string): Mission | undefined => {
  return mockData.missions.find((mission) => mission.id === id);
};

// Helper function to get requests by mission ID
export const getRequestsByMissionId = (missionId: string): Request[] => {
  return mockData.requests.filter((request) => request.missionId === missionId);
};

// Helper function to get request by ID
export const getRequestById = (id: string): Request | undefined => {
  return mockData.requests.find((request) => request.id === id);
};

// Helper function to get missions by user ID
export const getMissionsBySdrId = (sdrId: string): Mission[] => {
  return mockData.missions.filter((mission) => mission.sdrId === sdrId);
};

// Helper function for current user
export const getCurrentUser = (): User => {
  // For now, return an SDR user by default
  return mockData.users[1]; // SDR user
};
