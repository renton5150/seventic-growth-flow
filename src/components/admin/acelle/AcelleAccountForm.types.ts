
import { AcelleAccount } from "@/types/acelle.types";

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

export interface AcelleAccountFormProps {
  account?: AcelleAccount;
  onSubmit: (data: AcelleFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}
