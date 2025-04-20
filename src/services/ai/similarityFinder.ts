
import { supabase } from "@/integrations/supabase/client";
import { SimilarityResult } from "./types";

export const findSimilarities = async (requestText: string, historicalRequests: any[]): Promise<SimilarityResult | null> => {
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
    
    if (data?.result?.error) {
      console.warn("[Anthropic Service] API returned an error:", data.result.error);
      return data.result.fallbackData || null;
    }
    
    return data.result as SimilarityResult;
  } catch (error) {
    console.error("[Anthropic Service] Exception finding similarities:", error);
    return null;
  }
};
