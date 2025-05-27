
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
    'sent': 'default',
    'done': 'default',
    'paused': 'outline',
    'failed': 'destructive'
  };
  
  return statusMap[status.toLowerCase()] || 'secondary';
};

/**
 * Formatte un pourcentage pour l'affichage
 */
export const renderPercentage = (value: number): string => {
  if (typeof value !== 'number' || isNaN(value)) return '0,0%';
  
  // Si la valeur est déjà un pourcentage (0-100)
  if (value > 1) {
    return `${value.toFixed(1).replace('.', ',')}%`;
  }
  
  // Si la valeur est une proportion (0-1)
  return `${(value * 100).toFixed(1).replace('.', ',')}%`;
};
