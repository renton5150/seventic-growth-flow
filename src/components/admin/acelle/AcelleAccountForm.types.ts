
import { AcelleAccount } from "@/types/acelle.types";

// Form values type for Acelle account form
export interface AcelleFormValues {
  name: string;
  api_endpoint: string;
  api_token: string;
  status: 'active' | 'inactive' | 'error';
  mission_id?: string;
  last_sync_error?: string | null;
  cache_priority?: number;
  last_sync_date?: string | null;
}

// Props for the AcelleAccountForm component
export interface AcelleAccountFormProps {
  account?: AcelleAccount;
  onSuccess: (account: AcelleAccount, wasEditing: boolean) => void;
  onCancel: () => void;
}
