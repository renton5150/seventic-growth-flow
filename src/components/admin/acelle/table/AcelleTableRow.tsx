
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
  
  // Date d'envoi avec fallback
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
   * Fonction améliorée pour extraire en sécurité une valeur statistique
   * Cette fonction explore plusieurs chemins possibles dans l'objet pour trouver la donnée
   */
  const getStatValue = (paths: string[][] | string[] | string, defaultValue = 0): number => {
    try {
      let pathsToTry: string[][] = [];
      
      if (typeof paths === 'string') {
        // Si c'est une chaîne simple, la transformer en tableau de chemins
        pathsToTry = [[paths]];
      } 
      else if (Array.isArray(paths) && paths.length > 0) {
        if (typeof paths[0] === 'string') {
          // Si c'est un tableau de chaînes, le considérer comme un seul chemin
          pathsToTry = [paths as string[]];
        } 
        else {
          // Sinon c'est déjà un tableau de chemins
          pathsToTry = paths as string[][];
        }
      }
      
      // Essayer chaque chemin possible jusqu'à trouver une valeur
      for (const path of pathsToTry) {
        let currentObj: any = campaign;
        let found = true;
        
        for (const key of path) {
          if (currentObj === undefined || currentObj === null) {
            found = false;
            break;
          }
          currentObj = currentObj[key];
        }
        
        if (found && currentObj !== undefined && currentObj !== null) {
          const numValue = Number(currentObj);
          if (!isNaN(numValue)) return numValue;
        }
      }
      
      return defaultValue;
    } catch (error) {
      console.warn(`Erreur lors de l'extraction de statistiques:`, error);
      return defaultValue;
    }
  };

  // Extraction des statistiques avec des chemins multiples pour chaque valeur
  // Cela nous permet de trouver les données même si la structure change
  const subscriberCount = getStatValue([
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
    ['data', 'total']
  ]);
  
  const deliveryRate = getStatValue([
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
  ]);
  
  const openRate = getStatValue([
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
  ]);
  
  const clickRate = getStatValue([
    ['statistics', 'click_rate'], 
    ['delivery_info', 'click_rate'],
    ['click_rate'],
    ['meta', 'click_rate'],
    ['meta', 'statistics', 'click_rate'],
    ['meta', 'delivery_info', 'click_rate'],
    ['track', 'click_rate'],
    ['data', 'click_rate']
  ]);
  
  const bounceCount = getStatValue([
    ['statistics', 'bounce_count'], 
    ['delivery_info', 'bounced', 'total'],
    ['bounce_count'],
    ['bounced'],
    ['meta', 'bounce_count'],
    ['meta', 'statistics', 'bounce_count'],
    ['meta', 'delivery_info', 'bounced', 'total'],
    ['track', 'bounce_count'],
    ['track', 'bounced', 'total'],
    ['data', 'bounce_count'],
    ['data', 'bounced', 'total']
  ]);
  
  const unsubscribeCount = getStatValue([
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
  ]);

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
