
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
      return accountData;
    }
  }
  
  const { data: accountsData } = await supabase
    .from('acelle_accounts')
    .select('*')
    .eq('status', 'active')
    .limit(1);
  
  return accountsData?.[0] || null;
};

