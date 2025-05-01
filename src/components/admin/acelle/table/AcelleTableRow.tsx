
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
  // Debug pour afficher la structure complète de la campagne
  console.debug(`Campagne reçue:`, campaign);
  
  // Garantir la présence d'un UID valide
  const campaignUid = campaign?.uid || '';
  
  // Garantie de valeurs sûres pour les propriétés obligatoires
  const campaignName = campaign?.name || "Sans nom";
  const campaignSubject = campaign?.subject || "Sans sujet";
  const campaignStatus = (campaign?.status || "unknown").toLowerCase();
  
  // Amélioration: priorité de récupération des dates
  const deliveryDate = campaign?.delivery_date || campaign?.run_at || null;
  
  // Fonction améliorée pour formater les dates avec vérification stricte
  const formatDateSafely = (dateString: string | null | undefined) => {
    if (!dateString) return "Non programmé";
    try {
      const date = new Date(dateString);
      // Vérification que la date est valide
      if (isNaN(date.getTime())) return "Date invalide";
      return format(date, "dd/MM/yyyy HH:mm", { locale: fr });
    } catch (error) {
      console.error(`Date invalide: ${dateString}`, error);
      return "Date invalide";
    }
  };

  // Obtenir l'affichage et le style du statut
  const statusDisplay = translateStatus(campaignStatus);
  const variant = getStatusBadgeVariant(campaignStatus) as "default" | "secondary" | "destructive" | "outline";

  // Fonction d'aide améliorée pour extraire des statistiques avec sécurité et valeurs par défaut
  // Accepte plusieurs chemins d'accès possibles pour une donnée et retourne la première valeur valide trouvée
  const getStatValue = (paths: string[][], defaultValue: number = 0): number => {
    try {
      for (const path of paths) {
        let obj: any = campaign;
        let valid = true;
        
        for (const key of path) {
          if (!obj || typeof obj !== 'object') {
            valid = false;
            break;
          }
          obj = obj[key];
        }
        
        if (valid && obj !== undefined && obj !== null) {
          // Force conversion to number
          const num = Number(obj);
          if (!isNaN(num)) {
            console.debug(`Stat found via path [${path.join('.')}]: ${num}`);
            return num;
          }
        }
      }
      return defaultValue;
    } catch (e) {
      console.warn(`Erreur lors de l'extraction de statistiques:`, e);
      return defaultValue;
    }
  };

  // Récupérer les données statistiques avec plusieurs chemins de repli
  // Amélioration: ajout de chemins supplémentaires et logging détaillé pour le débogage
  const subscriberCount = getStatValue([
    ['statistics', 'subscriber_count'], 
    ['delivery_info', 'total'], 
    ['meta', 'subscribers_count'],
    ['recipient_count']
  ]);
                     
  const deliveryRate = getStatValue([
    ['statistics', 'delivered_rate'], 
    ['delivery_info', 'delivery_rate'],
    ['meta', 'delivered_rate']
  ]);
                  
  const openRate = getStatValue([
    ['statistics', 'uniq_open_rate'], 
    ['statistics', 'open_rate'], 
    ['delivery_info', 'unique_open_rate'],
    ['delivery_info', 'open_rate'],
    ['meta', 'open_rate']
  ]);
                
  const clickRate = getStatValue([
    ['statistics', 'click_rate'], 
    ['delivery_info', 'click_rate'],
    ['meta', 'click_rate']
  ]);
                 
  const bounceCount = getStatValue([
    ['statistics', 'bounce_count'], 
    ['delivery_info', 'bounced', 'total'],
    ['bounce_count'],
    ['meta', 'bounce_count']
  ]);
                   
  const unsubscribeCount = getStatValue([
    ['statistics', 'unsubscribe_count'], 
    ['delivery_info', 'unsubscribed'],
    ['unsubscribed_count'],
    ['meta', 'unsubscribe_count']
  ]);

  // Gestionnaire de clic sécurisé
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
