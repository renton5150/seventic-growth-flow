
import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export interface ChatResponse {
  response: string;
  timestamp: string;
  error?: string;
}

export const sendChatMessage = async (question: string): Promise<ChatResponse> => {
  try {
    console.log("[AI Chat Service] Sending question:", question);
    
    const { data, error } = await supabase.functions.invoke("ai-chat", {
      body: { 
        question,
        context: "seventic-dashboard"
      }
    });
    
    if (error) {
      console.error("[AI Chat Service] Error:", error);
      throw new Error(error.message || "Erreur lors de la communication avec l'IA");
    }
    
    console.log("[AI Chat Service] Response received:", data);
    return data as ChatResponse;
  } catch (error) {
    console.error("[AI Chat Service] Exception:", error);
    throw error;
  }
};
