
import { AcelleAccount } from "@/types/acelle.types";

export interface AcelleFormValues {
  name: string;
  apiEndpoint: string;
  apiToken: string;
  status: 'active' | 'inactive' | 'error';
  missionId?: string;
  lastSyncError?: string | null;
  cachePriority?: number;
  lastSyncDate?: string | null;
}

export interface AcelleAccountFormProps {
  account?: AcelleAccount;
  onSubmit: (data: AcelleFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}
