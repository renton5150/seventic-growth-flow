
/**
 * Traduit les statuts techniques des campagnes en libellés français pour l'affichage
 */
export const translateStatus = (status: string): string => {
  const translations: Record<string, string> = {
    'new': 'Nouveau',
    'queued': 'En attente',
    'ready': 'En attente',
    'sending': 'En envoi',
    'sent': 'Envoyé',
    'paused': 'En pause',
    'failed': 'Échoué'
  };
  
  return translations[status.toLowerCase()] || 'Inconnu';
};

/**
 * Retourne la variante de badge appropriée en fonction du statut
 */
export const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  const statusLower = status.toLowerCase();
  
  switch (statusLower) {
    case 'sent':
      return "default"; // Vert par défaut
    case 'sending':
      return "secondary"; // Bleu
    case 'failed':
      return "destructive"; // Rouge
    case 'new':
    case 'queued':
    case 'ready':
    case 'paused':
    default:
      return "outline"; // Gris
  }
};

/**
 * Formate un pourcentage pour l'affichage
 */
export const renderPercentage = (value?: number): string => {
  if (value === undefined || value === null) return "0%";
  
  // Convertir en pourcentage si c'est une décimale
  const percentage = value > 1 ? value : value * 100;
  
  return `${percentage.toFixed(1)}%`;
};
