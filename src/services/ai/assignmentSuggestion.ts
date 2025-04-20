
import { supabase } from "@/integrations/supabase/client";
import { AssignmentSuggestion } from "./types";

export const suggestAssignments = async (requestData: any, teamData: any): Promise<AssignmentSuggestion | null> => {
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
    
    if (data?.result?.error) {
      console.warn("[Anthropic Service] API returned an error:", data.result.error);
      return data.result.fallbackData || null;
    }
    
    return data.result as AssignmentSuggestion;
  } catch (error) {
    console.error("[Anthropic Service] Exception suggesting assignments:", error);
    return null;
  }
};
