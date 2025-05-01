
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
  // Debug complet pour afficher la structure entière de la campagne
  console.debug(`Campagne reçue (${campaign?.name}):`, JSON.stringify(campaign, null, 2));
  
  // Garantir la présence d'un UID valide
  const campaignUid = campaign?.uid || '';
  
  // Garantie de valeurs sûres pour les propriétés obligatoires
  const campaignName = campaign?.name || "Sans nom";
  const campaignSubject = campaign?.subject || "Sans sujet";
  const campaignStatus = (campaign?.status || "unknown").toLowerCase();
  
  // Amélioration: priorité de récupération des dates avec logging détaillé
  let deliveryDate = null;
  if (campaign?.delivery_date) {
    deliveryDate = campaign.delivery_date;
    console.debug(`Date d'envoi depuis delivery_date: ${deliveryDate}`);
  } else if (campaign?.run_at) {
    deliveryDate = campaign.run_at;
    console.debug(`Date d'envoi depuis run_at: ${deliveryDate}`);
  } else if (campaign?.meta?.delivery_date) {
    deliveryDate = campaign.meta.delivery_date;
    console.debug(`Date d'envoi depuis meta.delivery_date: ${deliveryDate}`);
  } else if (campaign?.meta?.run_at) {
    deliveryDate = campaign.meta.run_at;
    console.debug(`Date d'envoi depuis meta.run_at: ${deliveryDate}`);
  }
  
  // Fonction améliorée pour formater les dates avec vérification stricte
  const formatDateSafely = (dateString: string | null | undefined) => {
    if (!dateString) return "Non programmé";
    try {
      const date = new Date(dateString);
      // Vérification que la date est valide
      if (isNaN(date.getTime())) {
        console.warn(`Date invalide: ${dateString}`);
        return "Date invalide";
      }
      return format(date, "dd/MM/yyyy HH:mm", { locale: fr });
    } catch (error) {
      console.error(`Erreur lors du formatage de la date: ${dateString}`, error);
      return "Date invalide";
    }
  };

  // Obtenir l'affichage et le style du statut
  const statusDisplay = translateStatus(campaignStatus);
  const variant = getStatusBadgeVariant(campaignStatus) as "default" | "secondary" | "destructive" | "outline";

  /**
   * Fonction d'extraction de statistiques complètement revue avec exploration exhaustive et logging détaillé
   * Cette fonction explore toutes les structures de données possibles pour trouver une valeur
   */
  const getStatValue = (pathOptions: (string | string[] | string[][])[], defaultValue: number = 0): number => {
    try {
      // Log de débogage détaillé pour suivre l'extraction
      console.debug(`Recherche de statistique dans les chemins:`, pathOptions);
      
      // Parcourir tous les chemins possibles
      for (const pathOption of pathOptions) {
        let paths: string[][] = [];
        
        // Convertir en tableau de chemins si c'est une chaîne simple
        if (typeof pathOption === 'string') {
          // Subdiviser le chemin en segments
          paths = [pathOption.split('.')];
        } 
        // Si c'est déjà un tableau de chaînes (un chemin), l'encapsuler
        else if (Array.isArray(pathOption) && typeof pathOption[0] === 'string') {
          // Conversion sécurisée pour éviter l'erreur TS2352
          paths = [pathOption as string[]];
        }
        // Sinon, c'est déjà un tableau de chemins
        else if (Array.isArray(pathOption)) {
          paths = pathOption as string[][];
        }
        
        // Essayer chaque chemin
        for (const path of paths) {
          try {
            let value: any = campaign;
            
            // Suivre le chemin dans l'objet
            for (const key of path) {
              if (value === undefined || value === null) break;
              value = value[key];
            }
            
            // Si une valeur est trouvée, la convertir en nombre
            if (value !== undefined && value !== null) {
              const numValue = Number(value);
              if (!isNaN(numValue)) {
                console.debug(`Statistique trouvée via chemin [${path.join('.')}]: ${numValue}`);
                return numValue;
              }
              console.debug(`Valeur non numérique trouvée via [${path.join('.')}]: ${value}`);
            }
          } catch (err) {
            // Continuer avec le prochain chemin si celui-ci échoue
            console.debug(`Échec d'accès via chemin [${path.join('.')}]: ${err}`);
          }
        }
      }
      
      console.debug(`Aucune statistique valide trouvée, retour de la valeur par défaut: ${defaultValue}`);
      return defaultValue;
    } catch (e) {
      console.warn(`Erreur lors de l'extraction de statistiques:`, e);
      return defaultValue;
    }
  };

  // Récupérer les données statistiques avec exploration exhaustive des structures possibles
  // Structure entièrement revue pour couvrir toutes les possibilités de nommage des champs y compris les chemins dans meta et track
  const subscriberCount = getStatValue([
    ['statistics', 'subscriber_count'], 
    ['delivery_info', 'total'], 
    ['meta', 'subscribers_count'],
    ['meta', 'total_subscribers'],
    ['meta', 'statistics', 'subscriber_count'],
    ['meta', 'delivery_info', 'total'],
    ['recipient_count'],
    'total',
    ['track', 'subscribers_count'],
    ['track', 'total'],
    ['data', 'subscribers_count'],
    ['data', 'total']
  ]);
                     
  const deliveryRate = getStatValue([
    ['statistics', 'delivered_rate'], 
    ['delivery_info', 'delivery_rate'],
    ['meta', 'delivered_rate'],
    ['meta', 'statistics', 'delivered_rate'],
    ['meta', 'delivery_info', 'delivery_rate'],
    'delivery_rate',
    'delivered_rate',
    ['track', 'delivery_rate'],
    ['track', 'delivered_rate'],
    ['data', 'delivery_rate'],
    ['data', 'delivered_rate']
  ]);
                  
  const openRate = getStatValue([
    ['statistics', 'uniq_open_rate'], 
    ['statistics', 'open_rate'], 
    ['delivery_info', 'unique_open_rate'],
    ['delivery_info', 'open_rate'],
    ['meta', 'open_rate'],
    ['meta', 'unique_open_rate'],
    ['meta', 'statistics', 'open_rate'],
    ['meta', 'statistics', 'uniq_open_rate'],
    ['meta', 'delivery_info', 'open_rate'],
    ['meta', 'delivery_info', 'unique_open_rate'],
    'open_rate',
    'unique_open_rate',
    'uniq_open_rate',
    ['track', 'open_rate'],
    ['track', 'unique_open_rate'],
    ['data', 'open_rate'],
    ['data', 'unique_open_rate']
  ]);
                
  const clickRate = getStatValue([
    ['statistics', 'click_rate'], 
    ['delivery_info', 'click_rate'],
    ['meta', 'click_rate'],
    ['meta', 'statistics', 'click_rate'],
    ['meta', 'delivery_info', 'click_rate'],
    'click_rate',
    ['track', 'click_rate'],
    ['data', 'click_rate']
  ]);
                 
  const bounceCount = getStatValue([
    ['statistics', 'bounce_count'], 
    ['delivery_info', 'bounced', 'total'],
    ['meta', 'bounce_count'],
    ['meta', 'statistics', 'bounce_count'],
    ['meta', 'delivery_info', 'bounced', 'total'],
    ['bounce_count'],
    'bounced',
    'bounce_count',
    ['track', 'bounce_count'],
    ['track', 'bounced', 'total'],
    ['data', 'bounce_count'],
    ['data', 'bounced', 'total']
  ]);
                   
  const unsubscribeCount = getStatValue([
    ['statistics', 'unsubscribe_count'], 
    ['delivery_info', 'unsubscribed'],
    ['meta', 'unsubscribe_count'],
    ['meta', 'statistics', 'unsubscribe_count'],
    ['meta', 'delivery_info', 'unsubscribed'],
    ['unsubscribed_count'],
    ['unsubscribe_count'],
    'unsubscribed',
    'unsubscribe_count',
    ['track', 'unsubscribe_count'],
    ['track', 'unsubscribed'],
    ['data', 'unsubscribe_count'],
    ['data', 'unsubscribed']
  ]);

  // Log de débogage pour vérifier les valeurs extraites
  console.debug(`Statistiques extraites pour la campagne ${campaignName}:`, {
    subscriberCount,
    deliveryRate,
    openRate,
    clickRate,
    bounceCount,
    unsubscribeCount
  });

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
