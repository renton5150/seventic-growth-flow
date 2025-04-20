
import { supabase } from "@/integrations/supabase/client";
import { RequestAnalysis } from "./types";

export const analyzeRequest = async (text: string): Promise<RequestAnalysis | null> => {
  try {
    console.log("[Anthropic Service] Analyzing request:", text.substring(0, 50) + "...");
    
    const { data, error } = await supabase.functions.invoke("anthropic-ai/analyze-request", {
      body: { text }
    });
    
    if (error) {
      console.error("[Anthropic Service] Error analyzing request:", error);
      return {
        topic: "Analysis unavailable",
        category: "N/A",
        relevantSkills: ["N/A"],
        priorityLevel: "Medium",
        complexity: "medium",
        keywords: ["N/A"],
        error: error.message || "An error occurred during analysis"
      };
    }
    
    if (data?.result?.error) {
      console.warn("[Anthropic Service] API returned an error:", data.result.error);
      return data.result.fallbackData || {
        topic: "Analysis unavailable",
        category: "N/A",
        relevantSkills: ["N/A"],
        priorityLevel: "Medium",
        complexity: "medium",
        keywords: ["N/A"],
        error: data.result.error
      };
    }
    
    console.log("[Anthropic Service] Analysis result:", data);
    return data.result as RequestAnalysis;
  } catch (error) {
    console.error("[Anthropic Service] Exception analyzing request:", error);
    return {
      topic: "Analysis unavailable",
      category: "Error",
      relevantSkills: ["N/A"],
      priorityLevel: "Medium",
      complexity: "medium",
      keywords: ["Error"],
      error: error.message || "An unexpected error occurred"
    };
  }
};
