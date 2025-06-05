import { Request, EmailCampaignRequest, LinkedInScrapingRequest, DatabaseRequest } from "../types/types";

// Mock requests
export const requests: Request[] = [
  {
    id: "request1",
    type: "email",
    title: "Product Launch Campaign",
    missionId: "mission1",
    missionName: "Mission Test",
    missionClient: "Client Test",
    createdBy: "user2",
    createdAt: new Date("2025-03-05"),
    status: "completed",
    dueDate: "2025-03-10",
    lastUpdated: new Date("2025-03-08"),
    sdrName: "John Doe",
    assignedToName: "Jane Smith",
    workflow_status: "completed",
    assigned_to: "user3",
    isLate: false,
    target_role: "growth",
    details: {
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
      emailType: "Mass email"
    }
  } as Request,
  {
    id: "request2",
    type: "database",
    title: "CRM Setup",
    missionId: "mission1",
    missionName: "Mission Test",
    missionClient: "Client Test",
    createdBy: "user2",
    createdAt: new Date("2025-03-06"),
    status: "inprogress",
    dueDate: "2025-03-15",
    lastUpdated: new Date("2025-03-12"),
    sdrName: "John Doe",
    assignedToName: "Jane Smith",
    workflow_status: "in_progress",
    assigned_to: "user3",
    isLate: false,
    target_role: "growth",
    details: {
      tool: "Hubspot",
      targeting: {
        jobTitles: ["CTO", "VP Engineering", "Technical Director"],
        industries: ["Software", "IT Services"],
        companySize: ["50-200", "201-500"],
      },
      blacklist: {
        accounts: { notes: "Exclude direct competitors" },
      },
    }
  } as Request,
  {
    id: "request3",
    type: "linkedin",
    title: "Startup Founders Scraping",
    missionId: "mission2",
    missionName: "Mission Test 2",
    missionClient: "Client Test 2",
    createdBy: "user2",
    createdAt: new Date("2025-03-16"),
    status: "pending",
    dueDate: "2025-04-10",
    lastUpdated: new Date("2025-03-16"),
    sdrName: "John Doe",
    assignedToName: "Non assigné",
    workflow_status: "pending_assignment",
    assigned_to: null,
    isLate: false,
    target_role: "growth",
    details: {
      targeting: {
        jobTitles: ["Founder", "CEO", "Co-Founder"],
        locations: ["Paris", "Lyon", "Bordeaux"],
        industries: ["SaaS", "Fintech", "Health Tech"],
        companySize: ["1-10", "11-50"],
      },
    }
  } as Request,
  {
    id: "request4",
    type: "email",
    title: "Financial Services Newsletter",
    missionId: "mission3",
    missionName: "Mission Finance",
    missionClient: "Client Finance",
    createdBy: "user2",
    createdAt: new Date("2025-03-22"),
    status: "pending",
    dueDate: "2025-03-26",
    lastUpdated: new Date("2025-03-22"),
    sdrName: "John Doe",
    assignedToName: "Non assigné",
    workflow_status: "pending_assignment",
    assigned_to: null,
    isLate: true,
    target_role: "growth",
    details: {
      template: {
        webLink: "https://docs.google.com/document/d/financial-template",
      },
      database: {
        notes: "Use financial sector contacts",
      },
      blacklist: {
        emails: { notes: "Exclude people who unsubscribed from previous campaigns" },
      },
      platform: "Mailchimp",
      statistics: {
        sent: 0,
        opened: 0,
        clicked: 0,
        bounced: 0
      },
      emailType: "Mass email"
    }
  } as Request,
  {
    id: "request5",
    type: "database",
    title: "Banking Executives",
    missionId: "mission3",
    missionName: "Mission Finance",
    missionClient: "Client Finance",
    createdBy: "user2",
    createdAt: new Date("2025-03-23"),
    status: "completed",
    dueDate: "2025-03-30",
    lastUpdated: new Date("2025-03-28"),
    sdrName: "John Doe",
    assignedToName: "Jane Smith",
    workflow_status: "completed",
    assigned_to: "user3",
    isLate: false,
    target_role: "growth",
    details: {
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
    }
  } as Request,
];

// Helper function to get requests by mission ID
export const getRequestsByMissionId = (missionId: string): Request[] => {
  return requests.filter((request) => request.missionId === missionId);
};

// Helper function to get request by ID
export const getRequestById = (id: string): Request | undefined => {
  return requests.find((request) => request.id === id);
};
