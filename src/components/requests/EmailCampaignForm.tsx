
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EmailCampaignFormProps {
  requestId?: string;
}

const EmailCampaignForm: React.FC<EmailCampaignFormProps> = ({ requestId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Formulaire de campagne</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Cette fonctionnalité n'est plus disponible.
        </p>
        {requestId && (
          <p className="text-sm text-muted-foreground mt-2">
            ID de la demande: {requestId}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailCampaignForm;
