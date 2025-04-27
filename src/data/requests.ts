
import { Request, EmailCampaignRequest, LinkedInScrapingRequest, DatabaseRequest } from "../types/types";

// Mock requests - using correct type conversions and proper details structure
export const requests: Request[] = [
  {
    id: "request1",
    type: "email",
    title: "Product Launch Campaign",
    missionId: "mission1",
    created_by: "user2",
    created_at: new Date("2025-03-05").toISOString(),
    status: "completed",
    due_date: new Date("2025-03-10").toISOString(),
    last_updated: new Date("2025-03-08").toISOString(),
    details: {
      title: "Product Launch Campaign",
      content: "<h1>Product Launch</h1><p>We're excited to announce...</p>",
      results: {
        emailsSent: 5000,
        openRate: 25,
        clickRate: 9,
        bounced: 50
      }
    },
    // Backward compatibility
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
    created_by: "user2",
    created_at: new Date("2025-03-06").toISOString(),
    status: "in_progress",
    due_date: new Date("2025-03-15").toISOString(),
    last_updated: new Date("2025-03-12").toISOString(),
    details: {
      targeting: {
        jobTitles: ["CTO", "VP Engineering", "Technical Director"],
        industries: ["Software", "IT Services"],
        companySize: ["50-200", "201-500"],
      },
      format: "CSV",
      fieldsNeeded: ["Email", "Phone", "Company"]
    },
    // Backward compatibility
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
    created_by: "user2",
    created_at: new Date("2025-03-16").toISOString(),
    status: "pending",
    due_date: new Date("2025-04-10").toISOString(),
    last_updated: new Date("2025-03-16").toISOString(),
    details: {
      targeting: {
        jobTitles: ["Founder", "CEO", "Co-Founder"],
        locations: ["Paris", "Lyon", "Bordeaux"],
        industries: ["SaaS", "Fintech", "Health Tech"],
        companySize: ["1-10", "11-50"],
      }
    },
    // Backward compatibility
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
    created_by: "user2",
    created_at: new Date("2025-03-22").toISOString(),
    status: "pending",
    due_date: new Date("2025-03-26").toISOString(),
    last_updated: new Date("2025-03-22").toISOString(),
    details: {
      title: "Financial Services Newsletter",
      subject: "Latest Updates in Financial Services",
      isLate: true,
    },
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
    statistics: {
      sent: 0,
      opened: 0,
      clicked: 0,
      bounced: 0
    }
  } as EmailCampaignRequest,
  
  {
    id: "request5",
    type: "database",
    title: "Banking Executives",
    missionId: "mission3",
    created_by: "user2",
    created_at: new Date("2025-03-23").toISOString(),
    status: "completed",
    due_date: new Date("2025-03-30").toISOString(),
    last_updated: new Date("2025-03-28").toISOString(),
    details: {
      targeting: {
        jobTitles: ["CFO", "Financial Director", "Controller"],
        industries: ["Banking", "Financial Services", "Insurance"],
        companySize: ["500+"],
        otherCriteria: "Focus on companies with over €50M annual revenue",
      },
      results: {
        contactsCount: 357
      }
    },
    // Backward compatibility
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

// Helper function to get requests by mission ID
export const getRequestsByMissionId = (missionId: string): Request[] => {
  return requests.filter((request) => request.missionId === missionId);
};

// Helper function to get request by ID
export const getRequestById = (id: string): Request | undefined => {
  return requests.find((request) => request.id === id);
};
