
import React from "react";
import { AcelleCampaign } from "@/types/acelle.types";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface CampaignTechnicalInfoProps {
  campaign: AcelleCampaign;
  noStatsAvailable: boolean;
}

export const CampaignTechnicalInfo = ({
  campaign,
  noStatsAvailable
}: CampaignTechnicalInfoProps) => {
  return (
    <div className="space-y-4">
      {/* Informations sur les statistiques */}
      {!noStatsAvailable && (
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-500 mr-2" />
          <AlertDescription className="text-blue-800">
            Les statistiques affichées sont des données réelles provenant de l'API Acelle.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Informations techniques */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations techniques</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">Identifiants</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="p-2 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground">UID</p>
                <p className="font-mono text-sm break-all">{campaign.uid || campaign.campaign_uid || 'N/A'}</p>
              </div>
              <div className="p-2 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="font-mono text-sm">{campaign.meta?.type || 'standard'}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-1">Dates et statut</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="p-2 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground">Créée le</p>
                <p className="font-mono text-sm">
                  {campaign.created_at ? new Date(campaign.created_at).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div className="p-2 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground">Envoyée le</p>
                <p className="font-mono text-sm">
                  {campaign.delivery_date ? new Date(campaign.delivery_date).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
          
          {campaign.last_error && (
            <div>
              <h4 className="font-medium mb-1">Dernière erreur</h4>
              <div className="p-2 bg-red-50 border-red-100 border rounded-md">
                <p className="text-sm text-red-800">{campaign.last_error}</p>
              </div>
            </div>
          )}
          
          <div>
            <h4 className="font-medium mb-1">Métadonnées brutes</h4>
            <div className="p-2 bg-muted rounded-md overflow-auto max-h-60">
              <pre className="text-xs">{JSON.stringify(campaign, null, 2)}</pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
