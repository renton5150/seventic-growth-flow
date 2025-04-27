
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { EmailCampaignRequest } from "@/types/types";

interface EmailCampaignFormProps {
  editMode?: boolean;
  initialData?: EmailCampaignRequest;
}

const EmailCampaignForm: React.FC<EmailCampaignFormProps> = ({ editMode = false, initialData }) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Cette fonctionnalité n'est pas encore implémentée.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

// Add named export for backward compatibility
export { EmailCampaignForm };

export default EmailCampaignForm;
