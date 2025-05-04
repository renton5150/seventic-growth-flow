
import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { AcelleCampaign } from "@/types/acelle.types";

interface CampaignTechnicalInfoProps {
  campaign: AcelleCampaign;
  demoMode?: boolean;
}

export const CampaignTechnicalInfo = ({ 
  campaign,
  demoMode = false
}: CampaignTechnicalInfoProps) => {
  // Formatage des dates
  const formatDate = (dateString?: string): string => {
    if (!dateString) return "Non définie";
    
    try {
      const date = new Date(dateString);
      return format(date, "dd MMMM yyyy à HH:mm", { locale: fr });
    } catch {
      return "Date invalide";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Données techniques</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">ID:</span>
            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
              {campaign.uid || campaign.campaign_uid}
            </code>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Dernière mise à jour:</span>
            <span>{formatDate(campaign.updated_at)}</span>
          </div>
          {campaign.run_at && (
            <div className="flex justify-between">
              <span className="text-gray-600">Date planifiée:</span>
              <span>{formatDate(campaign.run_at)}</span>
            </div>
          )}
        </div>
        
        {demoMode && (
          <div className="mt-4 p-2 bg-yellow-50 text-yellow-800 text-sm rounded-md">
            Mode démonstration activé : les données affichées sont simulées.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
