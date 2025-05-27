
import { supabase } from "@/integrations/supabase/client";
import { ActionResponse } from "./types";

// Resend invitation with optimized parameters
export const resendInvitation = async (userEmail: string): Promise<ActionResponse & { userExists?: boolean; actionUrl?: string; emailProvider?: string; smtpConfigured?: boolean }> => {
  try {
    // Check for empty email
    if (!userEmail) {
      console.error("Empty user email");
      return { success: false, error: "L'email de l'utilisateur est vide" };
    }
    
    // Validate email format
    if (!userEmail.includes('@')) {
      console.error("Invalid email format:", userEmail);
      return { success: false, error: `Format d'email invalide: ${userEmail}` };
    }
    
    console.log("Attempting to resend invitation for:", userEmail);
    
    // Get current application base URL
    const origin = window.location.origin;
    
    // Utiliser la nouvelle URL de callback
    const redirectUrl = `${origin}/auth-callback?email=${encodeURIComponent(userEmail)}`;
    
    // Use a longer client-side timeout (30 seconds)
    const timeoutPromise = new Promise<{ success: boolean, warning: string }>((resolve) => {
      setTimeout(() => {
        resolve({ 
          success: true, 
          warning: "L'opération a pris plus de temps que prévu mais l'email a probablement été envoyé."
        });
      }, 30000); // 30 seconds timeout
    });
    
    // Request params with much longer validity period (180 days / ~6 months)
    const requestParams = { 
      email: userEmail,
      redirectUrl,
      checkSmtpConfig: true,
      skipJwtVerification: true,
      debug: true,
      timestamp: new Date().toISOString(),
      // Add much longer validity period (180 days)
      inviteOptions: {
        expireIn: 15552000 // 180 days in seconds (6 months)
      }
    };
    
    console.log("Calling resend-invitation Edge function with:", JSON.stringify(requestParams, null, 2));
    
    // Call the Edge function with retry capability
    const makeInviteRequest = async (retryCount = 0): Promise<any> => {
      try {
        const response = await supabase.functions.invoke('resend-invitation', { 
          body: requestParams
        });
        console.log("Edge function response:", JSON.stringify(response, null, 2));
        return response;
      } catch (error) {
        console.error(`Error in attempt ${retryCount + 1}:`, error);
        if (retryCount < 2) { // Allow up to 2 retries
          console.warn(`Retry ${retryCount + 1} after error:`, error);
          // Exponential backoff
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retryCount)));
          return makeInviteRequest(retryCount + 1);
        }
        throw error;
      }
    };
    
    const invitePromise = makeInviteRequest().catch(error => {
      console.error("Error calling Edge function after retries:", error);
      return { error: { message: error.message || "Connection error after multiple attempts" } };
    });
    
    // Race between timeout and function call
    const result = await Promise.race([invitePromise, timeoutPromise]);
    
    // If timeout won
    if ('warning' in result) {
      console.warn("Timeout exceeded when sending email:", {
        email: userEmail,
        redirectUrl,
        timestamp: new Date().toISOString()
      });
      return result;
    }
    
    // Log the complete response
    console.log("Complete response from resend-invitation:", JSON.stringify(result, null, 2));
    
    // Check for errors in various possible formats
    let errorMessage = null;
    
    if ('error' in result) {
      const error = result.error;
      errorMessage = error?.message || error?.error || (typeof error === 'string' ? error : null);
    }
    
    if (errorMessage) {
      console.error("Error sending email:", errorMessage);
      return { success: false, error: errorMessage || "Erreur lors de l'envoi de l'invitation" };
    }

    // Safely access data
    const data = 'data' in result ? result.data : null;
    
    // Check if response contains specific errors
    if (data?.error) {
      console.error("Error in response data:", data.error);
      return { success: false, error: data.error };
    }
    
    if (!data || data.success === false) {
      console.error("Negative response when sending email:", data);
      return { success: false, error: data?.error || "Failed to send email" };
    }
    
    console.log("Email successfully sent to:", userEmail, "Response data:", data);
    return { 
      success: true,
      userExists: data.userExists || false,
      actionUrl: data.actionUrl || undefined,
      emailProvider: data.emailProvider || undefined,
      smtpConfigured: data.smtpConfigured || false
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    console.error("Exception when sending email:", error);
    return { success: false, error: errorMessage };
  }
};
