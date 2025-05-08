
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
 * Formatte un pourcentage pour l'affichage
 * Gère correctement différents types d'entrées (nombre, chaîne, etc.)
 */
export const renderPercentage = (value: any): string => {
  // Cas particulier pour les valeurs nulles ou undefined
  if (value === null || value === undefined) {
    return '0,0%';
  }
  
  // Convertir les chaînes en nombres
  let numValue: number;
  
  if (typeof value === 'string') {
    // Enlever les caractères non numériques sauf le point et la virgule
    const cleanedValue = value.replace(/[^0-9.,-]/g, '').replace(',', '.');
    numValue = parseFloat(cleanedValue);
  } else {
    numValue = parseFloat(String(value));
  }
  
  // Vérifier si la conversion a échoué
  if (isNaN(numValue)) {
    return '0,0%';
  }
  
  // Si la valeur est déjà un pourcentage (0-100)
  if (numValue > 1) {
    return `${numValue.toFixed(1).replace('.', ',')}%`;
  }
  
  // Si la valeur est une proportion (0-1)
  return `${(numValue * 100).toFixed(1).replace('.', ',')}%`;
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
    const cleanedValue = value.replace(/[^0-9.,-]/g, '').replace(',', '.');
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
