
import React from "react";

/**
 * Traduit les statuts de campagne en français
 */
export const translateStatus = (status: string): string => {
  const translations: Record<string, string> = {
    "new": "Nouveau",
    "queued": "En attente",
    "sending": "En envoi",
    "sent": "Envoyé",
    "paused": "En pause",
    "failed": "Échoué"
  };
  
  return translations[status.toLowerCase()] || status;
};

/**
 * Détermine la variante de badge à utiliser selon le statut
 */
export const getStatusBadgeVariant = (status: string): string => {
  const statusMap: Record<string, string> = {
    "new": "secondary",
    "queued": "secondary",
    "sending": "default",
    "sent": "outline",
    "paused": "secondary",
    "failed": "destructive"
  };
  
  return statusMap[status.toLowerCase()] || "outline";
};

/**
 * Affiche un pourcentage avec le symbole % et arrondi à une décimale
 */
export const renderPercentage = (value: number): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%';
  }
  return `${value.toFixed(1)}%`;
};
