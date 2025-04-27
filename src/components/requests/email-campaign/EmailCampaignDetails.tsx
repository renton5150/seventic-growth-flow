
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const EmailCampaignDetails = () => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Détails de la campagne</h3>
          <p className="text-sm text-muted-foreground">
            Cette fonctionnalité n'est plus disponible.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailCampaignDetails;
