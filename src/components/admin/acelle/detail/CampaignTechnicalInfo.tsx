
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AcelleCampaign } from "@/types/acelle.types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

interface CampaignTechnicalInfoProps {
  campaign: AcelleCampaign;
  demoMode?: boolean;
  hasSimulatedStats?: boolean;
  noStatsAvailable?: boolean;
}

export const CampaignTechnicalInfo = ({ 
  campaign, 
  demoMode = false,
  hasSimulatedStats = false,
  noStatsAvailable = false
}: CampaignTechnicalInfoProps) => {
  if (!campaign) return null;

  // Formatage sécurisé des dates
  const formatDateSafely = (dateString: string | null | undefined) => {
    if (!dateString) return "Non défini";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Date invalide";
      return format(date, "dd/MM/yyyy HH:mm", { locale: fr });
    } catch {
      return "Date invalide";
    }
  };

  // Traduction du statut
  const translateStatus = (status: string): string => {
    const translations: Record<string, string> = {
      "new": "Nouveau",
      "queued": "En attente",
      "sending": "En envoi",
      "sent": "Envoyé",
      "paused": "En pause",
      "failed": "Échoué"
    };
    
    return translations[status] || status;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Informations de la campagne</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Identifiant</span>
              <span>{campaign.uid || campaign.campaign_uid || "Non défini"}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Statut</span>
              <div className="flex items-center gap-2">
                <Badge variant={campaign.status === "sent" ? "success" : "secondary"}>
                  {translateStatus(campaign.status)}
                </Badge>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Créée le</span>
              <span>{formatDateSafely(campaign.created_at)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Mise à jour le</span>
              <span>{formatDateSafely(campaign.updated_at)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Date d'envoi</span>
              <span>{formatDateSafely(campaign.delivery_date || campaign.run_at)}</span>
            </div>
            {campaign.last_error && (
              <div className="flex flex-col col-span-2">
                <span className="text-sm text-muted-foreground">Dernière erreur</span>
                <span className="text-red-500">{campaign.last_error}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Statistiques
            {noStatsAvailable && (
              <span className="text-sm font-normal text-red-600 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Non disponibles
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {noStatsAvailable ? (
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-sm">
                  <strong>Aucune statistique n'est disponible pour cette campagne.</strong>
                  <span className="block mt-1">
                    Pour obtenir des statistiques réelles, essayez de synchroniser les données depuis l'API Acelle.
                    Si après synchronisation les statistiques restent indisponibles, il est possible que les données n'aient 
                    pas encore été enregistrées par le serveur d'emailing.
                  </span>
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-500" />
                <p className="text-sm">
                  <strong>Les statistiques affichées sont réelles.</strong>
                  <span className="block mt-1">
                    Ces données ont été récupérées depuis l'API Acelle ou le cache de la base de données.
                  </span>
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Source des données</span>
                <span>{noStatsAvailable ? "Aucune donnée disponible" : "API Acelle ou cache de la base de données"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Type de données</span>
                <span>{noStatsAvailable ? "Aucune donnée disponible" : "Données réelles"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
