
import { BadgeProps } from "@/components/ui/badge";

/**
 * Traduit les statuts techniques en libellés français pour l'affichage
 */
export const translateStatus = (status: string): string => {
  const translations: Record<string, string> = {
    'new': 'Nouveau',
    'queued': 'En attente',
    'ready': 'En attente',
    'sending': 'En envoi',
    'sent': 'Envoyé',
    'done': 'Terminé',
    'paused': 'En pause',
    'failed': 'Échoué'
  };
  
  return translations[status.toLowerCase()] || 'Inconnu';
};

/**
 * Détermine la variante de badge à utiliser en fonction du statut
 */
export const getStatusBadgeVariant = (status: string): BadgeProps["variant"] => {
  const statusMap: Record<string, BadgeProps["variant"]> = {
    'new': 'secondary',
    'queued': 'secondary',
    'ready': 'secondary',
    'sending': 'default',
    'sent': 'success',
    'done': 'success',
    'paused': 'outline',
    'failed': 'destructive'
  };
  
  return statusMap[status.toLowerCase()] || 'secondary';
};

/**
 * Extraire et normaliser un taux d'ouverture à partir de différentes sources
 * Cette fonction robuste gère tous les formats possibles
 */
export const extractOpenRate = (data: any): number => {
  if (!data) return 0;
  
  // Essayer plusieurs chemins possibles pour obtenir le taux d'ouverture
  let value: any;
  
  if (typeof data === 'object') {
    // Essayer toutes les clés possibles pour le taux d'ouverture
    value = data.uniq_open_rate ?? 
            data.unique_open_rate ?? 
            data.open_rate;
  } else {
    value = data;
  }
  
  // Convertir en nombre
  let numValue = parseFloat(String(value || '0').replace(/[^0-9.,\-]/g, '').replace(',', '.'));
  
  // Vérifier si la conversion a réussi
  if (isNaN(numValue)) {
    console.log("Conversion en nombre échouée pour:", value);
    return 0;
  }
  
  // Si c'est un pourcentage décimal (entre 0 et 1), le convertir en pourcentage 0-100
  if (numValue > 0 && numValue < 1) {
    numValue = numValue * 100;
  }
  
  return numValue;
};

/**
 * Extraire et normaliser un taux de clic à partir de différentes sources
 * Cette fonction robuste gère tous les formats possibles
 */
export const extractClickRate = (data: any): number => {
  if (!data) return 0;
  
  // Essayer plusieurs chemins possibles pour obtenir le taux de clic
  let value: any;
  
  if (typeof data === 'object') {
    // Essayer toutes les clés possibles pour le taux de clic
    value = data.click_rate;
  } else {
    value = data;
  }
  
  // Convertir en nombre
  let numValue = parseFloat(String(value || '0').replace(/[^0-9.,\-]/g, '').replace(',', '.'));
  
  // Vérifier si la conversion a réussi
  if (isNaN(numValue)) {
    console.log("Conversion en nombre échouée pour:", value);
    return 0;
  }
  
  // Si c'est un pourcentage décimal (entre 0 et 1), le convertir en pourcentage 0-100
  if (numValue > 0 && numValue < 1) {
    numValue = numValue * 100;
  }
  
  return numValue;
};

/**
 * Formatte un pourcentage pour l'affichage
 * Version robuste qui gère n'importe quel format d'entrée
 */
export const renderPercentage = (value: any): string => {
  // Cas particulier pour les valeurs nulles ou undefined
  if (value === null || value === undefined) {
    return '0,0%';
  }
  
  // Si c'est déjà un nombre
  let numValue: number;
  
  if (typeof value === 'number') {
    numValue = value;
  } else if (typeof value === 'string') {
    // Nettoyer la chaîne (supprimer les caractères non numériques sauf . et ,)
    const cleanValue = value.replace(/[^0-9.,\-]/g, '').replace(',', '.');
    numValue = parseFloat(cleanValue);
  } else {
    // Essayer de convertir tout autre type
    try {
      numValue = parseFloat(String(value));
    } catch {
      numValue = 0;
    }
  }
  
  // Vérifier si la conversion a échoué
  if (isNaN(numValue)) {
    return '0,0%';
  }
  
  // Si la valeur est très petite (décimale), la multiplier
  // Convertir les proportions (0-1) en pourcentages (0-100)
  if (numValue > 0 && numValue < 1) {
    numValue = numValue * 100;
  }
  
  // Formater avec 1 décimale et remplacer le . par , (format français)
  return `${numValue.toFixed(1).replace('.', ',')}%`;
};

/**
 * Formate un nombre pour l'affichage
 * S'assure que la valeur est toujours un nombre valide
 */
export const formatNumberSafely = (value: any): string => {
  // Si la valeur est null ou undefined
  if (value === null || value === undefined) {
    return '0';
  }
  
  // Convertir en nombre
  let numValue: number;
  
  if (typeof value === 'string') {
    // Nettoyer la chaîne
    const cleanedValue = value.replace(/[^0-9.,\-]/g, '').replace(',', '.');
    numValue = parseFloat(cleanedValue);
  } else {
    numValue = parseFloat(String(value));
  }
  
  // Vérifier si la conversion a échoué
  if (isNaN(numValue)) {
    return '0';
  }
  
  // Retourner le nombre formaté avec séparateur de milliers
  return numValue.toLocaleString();
};

/**
 * Diagnostique les problèmes de statistiques de campagne
 * Cette fonction est utilisée pour le débogage
 */
export const diagnoseCampaignStatistics = (campaign: any): any => {
  if (!campaign) return { error: "Campaign is null or undefined" };
  
  // Collecter les données pour le débogage
  const diagData = {
    campaignId: campaign.uid || campaign.campaign_uid || 'unknown',
    campaignName: campaign.name || 'unknown',
    
    // Vérifier les différentes structures de données
    hasDeliveryInfo: !!campaign.delivery_info,
    hasStatistics: !!campaign.statistics,
    
    // Extraire les taux pour analyse
    extractedOpenRate: extractOpenRate(campaign.delivery_info || campaign.statistics),
    extractedClickRate: extractClickRate(campaign.delivery_info || campaign.statistics),
    
    // Données brutes pour vérification
    rawData: {
      deliveryInfo: campaign.delivery_info || null,
      statistics: campaign.statistics || null
    },
    
    // Valeurs des champs potentiels
    fields: {
      openRate: {
        uniqOpenRate: campaign.delivery_info?.uniq_open_rate || campaign.statistics?.uniq_open_rate || null,
        uniqueOpenRate: campaign.delivery_info?.unique_open_rate || campaign.statistics?.unique_open_rate || null,
        openRate: campaign.delivery_info?.open_rate || campaign.statistics?.open_rate || null,
      },
      clickRate: {
        clickRate: campaign.delivery_info?.click_rate || campaign.statistics?.click_rate || null
      }
    }
  };
  
  console.log(`Diagnostic pour campagne ${diagData.campaignName}:`, diagData);
  return diagData;
};
