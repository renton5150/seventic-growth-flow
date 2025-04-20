
import { supabase } from "@/integrations/supabase/client";
import { ActivitySummary } from "./types";

export const generateSummary = async (activityData: any): Promise<ActivitySummary | null> => {
  try {
    console.log("[Anthropic Service] Generating summary for activities");
    
    const { data, error } = await supabase.functions.invoke("anthropic-ai/generate-summary", {
      body: { data: activityData }
    });
    
    if (error) {
      console.error("[Anthropic Service] Error generating summary:", error);
      return null;
    }
    
    if (data?.result?.error) {
      console.warn("[Anthropic Service] API returned an error:", data.result.error);
      return data.result.fallbackData || null;
    }
    
    return data.result as ActivitySummary;
  } catch (error) {
    console.error("[Anthropic Service] Exception generating summary:", error);
    return null;
  }
};
