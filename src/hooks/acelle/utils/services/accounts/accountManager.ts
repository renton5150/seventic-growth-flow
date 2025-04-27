
import { supabase } from "@/integrations/supabase/client";
import { AcelleAccount } from "@/types/acelle.types";

export const getActiveAccount = async (accountId?: string): Promise<AcelleAccount | null> => {
  if (accountId) {
    const { data: accountData } = await supabase
      .from('acelle_accounts')
      .select('*')
      .eq('id', accountId)
      .single();
    
    if (accountData) {
      return {
        id: accountData.id,
        missionId: accountData.mission_id,
        name: accountData.name,
        apiEndpoint: accountData.api_endpoint,
        apiToken: accountData.api_token,
        lastSyncDate: accountData.last_sync_date,
        status: accountData.status as AcelleAccount["status"],
        createdAt: accountData.created_at,
        updatedAt: accountData.updated_at
      };
    }
  }
  
  const { data: accountsData } = await supabase
    .from('acelle_accounts')
    .select('*')
    .eq('status', 'active')
    .limit(1);
  
  if (accountsData && accountsData.length > 0) {
    return {
      id: accountsData[0].id,
      missionId: accountsData[0].mission_id,
      name: accountsData[0].name,
      apiEndpoint: accountsData[0].api_endpoint,
      apiToken: accountsData[0].api_token,
      lastSyncDate: accountsData[0].last_sync_date,
      status: accountsData[0].status as AcelleAccount["status"],
      createdAt: accountsData[0].created_at,
      updatedAt: accountsData[0].updated_at
    };
  }
  
  return null;
};
