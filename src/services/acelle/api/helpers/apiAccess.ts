
import { AcelleAccount } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ACELLE_PROXY_BASE_URL = "https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy";

export const checkApiAccess = async (account: AcelleAccount): Promise<boolean> => {
  try {
    console.log(`Testing API accessibility for account: ${account.name}`);
    
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    if (!accessToken) {
      console.error("No auth token available for API access check");
      return false;
    }
    
    const apiEndpoint = account.apiEndpoint?.endsWith('/') 
      ? account.apiEndpoint.slice(0, -1) 
      : account.apiEndpoint;
      
    if (!apiEndpoint) {
      console.error(`Invalid API endpoint for account: ${account.name}`);
      return false;
    }

    const response = await fetch(`${ACELLE_PROXY_BASE_URL}/me?api_token=ping&endpoint=${encodeURIComponent(apiEndpoint)}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "X-Acelle-Endpoint": apiEndpoint,
        "Authorization": `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      console.error(`API accessibility check failed: ${response.status}`);
      return false;
    }

    const result = await response.json();
    console.log("API accessibility check result:", result);
    
    return result.status === 'active';
  } catch (error) {
    console.error("Error checking API accessibility:", error);
    return false;
  }
};
