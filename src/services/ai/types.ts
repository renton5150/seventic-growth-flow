
export interface RequestAnalysis {
  topic: string;
  category: string;
  relevantSkills: string[];
  priorityLevel: string;
  complexity: "low" | "medium" | "high";
  keywords: string[];
  error?: string;
}

export interface ActivitySummary {
  summary: string;
  patterns: string[];
  achievements: string[];
  bottlenecks: string[];
  insights: string[];
  error?: string;
}

export interface AssignmentSuggestion {
  topAssignments: {
    userId: string;
    userName?: string;
    matchScore: number;
    reasoning: string;
  }[];
  error?: string;
}

export interface SimilarityResult {
  similarRequests: {
    requestId: string;
    title?: string;
    similarityScore: number;
    matchReason: string;
  }[];
  error?: string;
}
