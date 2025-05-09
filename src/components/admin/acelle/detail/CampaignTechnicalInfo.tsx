
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AcelleCampaign } from "@/types/acelle.types";
import { Badge } from "@/components/ui/badge";

interface CampaignTechnicalInfoProps {
  campaign: AcelleCampaign;
  demoMode?: boolean;
  dataSource?: 'cache' | 'api' | 'demo' | null;
}

export const CampaignTechnicalInfo = ({ 
  campaign, 
  demoMode = false,
  dataSource = null
}: CampaignTechnicalInfoProps) => {
  // Fonction pour formatter les dates
  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return 'Non définie';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return 'Format invalide';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-medium">Informations système</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Identifiants</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">UID:</span>
                  <span className="font-mono text-sm">{campaign.uid || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Campaign UID:</span>
                  <span className="font-mono text-sm">{campaign.campaign_uid || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Dates</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Création:</span>
                  <span>{formatDate(campaign.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mise à jour:</span>
                  <span>{formatDate(campaign.updated_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Envoi:</span>
                  <span>{formatDate(campaign.delivery_date || campaign.run_at)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Source des données</h4>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Type:</span>
              <Badge variant={
                dataSource === 'api' 
                  ? "default" 
                  : dataSource === 'cache' 
                    ? "secondary" 
                    : dataSource === 'demo' 
                      ? "outline" 
                      : "destructive"
              }>
                {dataSource === 'api' 
                  ? "API Directe" 
                  : dataSource === 'cache' 
                    ? "Cache Local" 
                    : dataSource === 'demo' 
                      ? "Données Demo" 
                      : "Inconnue"}
              </Badge>
              
              {demoMode && (
                <Badge variant="outline" className="ml-2 bg-blue-50">Mode démo</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {campaign.last_error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <h3 className="font-medium text-red-700 mb-2">Dernière erreur</h3>
            <p className="text-red-600 font-mono text-sm whitespace-pre-wrap">{campaign.last_error}</p>
          </CardContent>
        </Card>
      )}
      
      {!demoMode && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">Données brutes (Debug)</h3>
            <div className="max-h-[300px] overflow-auto rounded bg-gray-50 p-4">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                {JSON.stringify({
                  campaign: {
                    ...campaign,
                    statistics: "... données masquées ...",
                  }
                }, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
