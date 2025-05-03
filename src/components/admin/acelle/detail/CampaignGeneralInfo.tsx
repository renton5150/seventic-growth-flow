
import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { AcelleCampaign } from "@/types/acelle.types";
import { translateStatus, getStatusBadgeVariant } from "@/utils/acelle/campaignStatusUtils";

interface CampaignGeneralInfoProps {
  campaign: AcelleCampaign;
}

export const CampaignGeneralInfo = ({ campaign }: CampaignGeneralInfoProps) => {
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
    <div>
      <h3 className="font-medium mb-2">Informations générales</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Nom:</span>
          <span className="font-medium">{campaign.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Sujet:</span>
          <span>{campaign.subject}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Statut:</span>
          <Badge variant={getStatusBadgeVariant(campaign.status)}>
            {translateStatus(campaign.status)}
          </Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Créée le:</span>
          <span>{formatDate(campaign.created_at)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Envoyée le:</span>
          <span>{formatDate(campaign.delivery_date)}</span>
        </div>
        {campaign.last_error && (
          <div className="flex justify-between">
            <span className="text-gray-600">Erreur:</span>
            <span className="text-red-500">{campaign.last_error}</span>
          </div>
        )}
      </div>
    </div>
  );
};
