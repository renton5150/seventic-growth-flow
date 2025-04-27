
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CampaignsList = () => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Dernières campagnes</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Cette fonctionnalité n'est plus disponible.
        </p>
      </CardContent>
    </Card>
  );
};

export default CampaignsList;
