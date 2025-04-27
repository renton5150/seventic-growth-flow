
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AcelleAccount } from '@/types/acelle.types';

interface CampaignsOverviewProps {
  campaigns: any[];
  accounts: AcelleAccount[];
}

const CampaignsOverview: React.FC<CampaignsOverviewProps> = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total des campagnes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            0
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Fonctionnalité retirée
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Taux d'ouverture moyen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            0%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Fonctionnalité retirée
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Taux de clic moyen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            0%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Fonctionnalité retirée
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Emails envoyés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            0
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Fonctionnalité retirée
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignsOverview;
