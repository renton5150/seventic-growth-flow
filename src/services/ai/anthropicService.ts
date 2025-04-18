
import { supabase } from "@/integrations/supabase/client";

// Types for different API responses
export interface RequestAnalysis {
  topic: string;
  category: string;
  relevantSkills: string[];
  priorityLevel: string;
  complexity: "low" | "medium" | "high";
  keywords: string[];
}

export interface ActivitySummary {
  summary: string;
  patterns: string[];
  achievements: string[];
  bottlenecks: string[];
  insights: string[];
}

export interface AssignmentSuggestion {
  topAssignments: {
    userId: string;
    userName?: string;
    matchScore: number;
    reasoning: string;
  }[];
}

export interface SimilarityResult {
  similarRequests: {
    requestId: string;
    title?: string;
    similarityScore: number;
    matchReason: string;
  }[];
}

// Main service class for Anthropic API interactions
export const AnthropicService = {
  /**
   * Analyzes a request text to extract key information
   */
  analyzeRequest: async (text: string): Promise<RequestAnalysis | null> => {
    try {
      console.log("[Anthropic Service] Analyzing request:", text.substring(0, 50) + "...");
      
      const { data, error } = await supabase.functions.invoke("anthropic-ai/analyze-request", {
        body: { text }
      });
      
      if (error) {
        console.error("[Anthropic Service] Error analyzing request:", error);
        return null;
      }
      
      console.log("[Anthropic Service] Analysis result:", data);
      return data.result as RequestAnalysis;
    } catch (error) {
      console.error("[Anthropic Service] Exception analyzing request:", error);
      return null;
    }
  },
  
  /**
   * Generates a summary of activities for a team or person
   */
  generateSummary: async (activityData: any): Promise<ActivitySummary | null> => {
    try {
      console.log("[Anthropic Service] Generating summary for activities");
      
      const { data, error } = await supabase.functions.invoke("anthropic-ai/generate-summary", {
        body: { data: activityData }
      });
      
      if (error) {
        console.error("[Anthropic Service] Error generating summary:", error);
        return null;
      }
      
      return data.result as ActivitySummary;
    } catch (error) {
      console.error("[Anthropic Service] Exception generating summary:", error);
      return null;
    }
  },
  
  /**
   * Suggests assignments based on request details and team workloads
   */
  suggestAssignments: async (requestData: any, teamData: any): Promise<AssignmentSuggestion | null> => {
    try {
      console.log("[Anthropic Service] Suggesting assignments");
      
      const { data, error } = await supabase.functions.invoke("anthropic-ai/suggest-assignments", {
        body: { 
          data: {
            request: requestData,
            team: teamData
          }
        }
      });
      
      if (error) {
        console.error("[Anthropic Service] Error suggesting assignments:", error);
        return null;
      }
      
      return data.result as AssignmentSuggestion;
    } catch (error) {
      console.error("[Anthropic Service] Exception suggesting assignments:", error);
      return null;
    }
  },
  
  /**
   * Finds similarities between a request and historical requests
   */
  findSimilarities: async (requestText: string, historicalRequests: any[]): Promise<SimilarityResult | null> => {
    try {
      console.log("[Anthropic Service] Finding similarities");
      
      const { data, error } = await supabase.functions.invoke("anthropic-ai/find-similarities", {
        body: { 
          text: requestText,
          data: historicalRequests
        }
      });
      
      if (error) {
        console.error("[Anthropic Service] Error finding similarities:", error);
        return null;
      }
      
      return data.result as SimilarityResult;
    } catch (error) {
      console.error("[Anthropic Service] Exception finding similarities:", error);
      return null;
    }
  }
};

export default AnthropicService;
