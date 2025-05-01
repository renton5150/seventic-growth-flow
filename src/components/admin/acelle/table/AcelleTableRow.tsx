
import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AcelleCampaign } from "@/types/acelle.types";
import { translateStatus, getStatusBadgeVariant, renderPercentage } from "@/utils/acelle/campaignStatusUtils";

interface AcelleTableRowProps {
  campaign: AcelleCampaign;
  onViewCampaign: (uid: string) => void;
}

export const AcelleTableRow = ({ campaign, onViewCampaign }: AcelleTableRowProps) => {
  // Debug léger pour éviter de surcharger la console
  if (!campaign) {
    console.error("Campagne non définie dans AcelleTableRow");
    return null;
  }
  
  // Garantir la présence d'un UID valide
  const campaignUid = campaign?.uid || '';
  
  // Garantie de valeurs sûres pour les propriétés obligatoires
  const campaignName = campaign?.name || "Sans nom";
  const campaignSubject = campaign?.subject || "Sans sujet";
  const campaignStatus = (campaign?.status || "unknown").toLowerCase();
  
  // Date d'envoi avec fallback - Utiliser delivery_date au lieu de delivery_at
  const deliveryDate = campaign?.delivery_date || campaign?.run_at || 
                       campaign?.meta?.delivery_date || campaign?.meta?.run_at || null;
  
  /**
   * Formatage sécurisé des dates
   */
  const formatDateSafely = (dateString: string | null | undefined) => {
    if (!dateString) return "Non programmé";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Date invalide";
      return format(date, "dd/MM/yyyy HH:mm", { locale: fr });
    } catch {
      return "Date invalide";
    }
  };

  // Obtenir l'affichage et le style du statut
  const statusDisplay = translateStatus(campaignStatus);
  const variant = getStatusBadgeVariant(campaignStatus) as "default" | "secondary" | "destructive" | "outline";

  /**
   * Fonction avancée pour extraire de manière sécurisée les statistiques 
   * depuis différentes structures de données possibles
   */
  const getStatValue = (paths: string[][]): number => {
    try {
      // Parcourir tous les chemins possibles pour trouver une valeur
      for (const path of paths) {
        let currentObj: any = campaign;
        let found = true;
        
        // Naviguer à travers le chemin
        for (const key of path) {
          if (currentObj === undefined || currentObj === null) {
            found = false;
            break;
          }
          currentObj = currentObj[key];
        }
        
        // Si on a trouvé une valeur non nulle
        if (found && currentObj !== undefined && currentObj !== null) {
          const numValue = Number(currentObj);
          if (!isNaN(numValue)) {
            console.log(`Valeur statistique trouvée via chemin [${path.join('.')}]:`, numValue);
            return numValue;
          }
        }
      }
      
      // Aucune valeur trouvée
      return 0;
    } catch (error) {
      console.warn(`Erreur lors de l'extraction de statistiques:`, error);
      return 0;
    }
  };

  // Définition de tous les chemins possibles pour chaque statistique
  // On utilise une approche exhaustive pour couvrir toutes les structures de données possibles
  const subscriberPaths = [
    ['statistics', 'subscriber_count'],
    ['delivery_info', 'total'],
    ['recipient_count'],
    ['meta', 'subscribers_count'],
    ['meta', 'total_subscribers'],
    ['meta', 'statistics', 'subscriber_count'],
    ['meta', 'delivery_info', 'total'],
    ['track', 'subscribers_count'],
    ['track', 'total'],
    ['data', 'subscribers_count'],
    ['data', 'total'],
    ['subscribers_count'],
    ['total_subscribers']
  ];
  
  const deliveryRatePaths = [
    ['statistics', 'delivered_rate'],
    ['delivery_info', 'delivery_rate'],
    ['delivered_rate'],
    ['delivery_rate'],
    ['meta', 'delivered_rate'],
    ['meta', 'statistics', 'delivered_rate'],
    ['meta', 'delivery_info', 'delivery_rate'],
    ['track', 'delivery_rate'],
    ['track', 'delivered_rate'],
    ['data', 'delivery_rate'],
    ['data', 'delivered_rate']
  ];
  
  const openRatePaths = [
    ['statistics', 'uniq_open_rate'],
    ['statistics', 'open_rate'],
    ['delivery_info', 'open_rate'],
    ['delivery_info', 'unique_open_rate'],
    ['open_rate'],
    ['unique_open_rate'],
    ['uniq_open_rate'],
    ['meta', 'open_rate'],
    ['meta', 'unique_open_rate'],
    ['meta', 'statistics', 'open_rate'],
    ['meta', 'statistics', 'uniq_open_rate'],
    ['meta', 'delivery_info', 'open_rate'],
    ['meta', 'delivery_info', 'unique_open_rate'],
    ['track', 'open_rate'],
    ['track', 'unique_open_rate'],
    ['data', 'open_rate'],
    ['data', 'unique_open_rate']
  ];
  
  const clickRatePaths = [
    ['statistics', 'click_rate'],
    ['delivery_info', 'click_rate'],
    ['click_rate'],
    ['meta', 'click_rate'],
    ['meta', 'statistics', 'click_rate'],
    ['meta', 'delivery_info', 'click_rate'],
    ['track', 'click_rate'],
    ['data', 'click_rate']
  ];
  
  const bouncePaths = [
    ['statistics', 'bounce_count'],
    ['delivery_info', 'bounced', 'total'],
    ['bounce_count'],
    ['bounced', 'total'],
    ['bounced'],
    ['meta', 'bounce_count'],
    ['meta', 'statistics', 'bounce_count'],
    ['meta', 'delivery_info', 'bounced', 'total'],
    ['track', 'bounce_count'],
    ['track', 'bounced', 'total'],
    ['data', 'bounce_count'],
    ['data', 'bounced', 'total']
  ];
  
  const unsubscribePaths = [
    ['statistics', 'unsubscribe_count'],
    ['delivery_info', 'unsubscribed'],
    ['unsubscribe_count'],
    ['unsubscribed'],
    ['unsubscribed_count'],
    ['meta', 'unsubscribe_count'],
    ['meta', 'statistics', 'unsubscribe_count'],
    ['meta', 'delivery_info', 'unsubscribed'],
    ['track', 'unsubscribe_count'],
    ['track', 'unsubscribed'],
    ['data', 'unsubscribe_count'],
    ['data', 'unsubscribed']
  ];

  // Extraire les valeurs
  const subscriberCount = getStatValue(subscriberPaths);
  const deliveryRate = getStatValue(deliveryRatePaths);
  const openRate = getStatValue(openRatePaths);
  const clickRate = getStatValue(clickRatePaths);
  const bounceCount = getStatValue(bouncePaths);
  const unsubscribeCount = getStatValue(unsubscribePaths);

  const handleViewClick = () => {
    if (campaignUid) {
      onViewCampaign(campaignUid);
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium truncate max-w-[200px]" title={campaignName}>
        {campaignName}
      </TableCell>
      <TableCell className="truncate max-w-[200px]" title={campaignSubject}>
        {campaignSubject}
      </TableCell>
      <TableCell>
        <Badge variant={variant}>{statusDisplay}</Badge>
      </TableCell>
      <TableCell>
        {formatDateSafely(deliveryDate)}
      </TableCell>
      <TableCell>
        {subscriberCount.toString()}
      </TableCell>
      <TableCell>
        {renderPercentage(deliveryRate)}
      </TableCell>
      <TableCell>
        {renderPercentage(openRate)}
      </TableCell>
      <TableCell>
        {renderPercentage(clickRate)}
      </TableCell>
      <TableCell>
        {bounceCount.toString()}
      </TableCell>
      <TableCell>
        {unsubscribeCount.toString()}
      </TableCell>
      <TableCell className="text-right">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleViewClick}
          title="Voir les détails"
          disabled={!campaignUid}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};
