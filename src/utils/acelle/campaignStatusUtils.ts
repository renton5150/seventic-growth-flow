
// Utility functions for Acelle campaign status handling

/**
 * Translates Acelle campaign statuses to French
 */
export const translateStatus = (status: string): string => {
  const cleanStatus = status.toLowerCase().trim();
  
  switch (cleanStatus) {
    case 'new':
    case 'draft':
      return 'Brouillon';
    case 'queuing':
    case 'queued':
      return 'En attente';
    case 'sending':
      return 'En cours';
    case 'sent':
    case 'done':
      return 'Envoyé';
    case 'ready':
      return 'Prêt';
    case 'paused':
      return 'En pause';
    case 'failed':
    case 'error':
      return 'Échec';
    case 'scheduled':
      return 'Planifié';
    case 'pending':
      return 'En attente';
    default:
      console.warn(`Status inconnu: ${status}`);
      return 'Inconnu';
  }
};

/**
 * Returns badge variant for campaign status
 */
export const getStatusBadgeVariant = (status: string): string => {
  const cleanStatus = status.toLowerCase().trim();
  
  switch (cleanStatus) {
    case 'new':
    case 'draft':
      return 'outline';
    case 'queuing':
    case 'queued':
    case 'scheduled':
    case 'pending':
      return 'secondary';
    case 'sending':
      return 'default';
    case 'sent':
    case 'done':
    case 'ready':
      return 'default';
    case 'paused':
      return 'outline';
    case 'failed':
    case 'error':
      return 'destructive';
    default:
      return 'outline';
  }
};

/**
 * Safely formats percentages for display
 */
export const renderPercentage = (value: number | undefined | null): string => {
  // Log pour le débogage
  console.debug(`Formatage du pourcentage: ${value}`);
  
  if (value === undefined || value === null) return "-";
  
  // Ensure value is a number
  value = Number(value);
  if (isNaN(value)) return "-";
  
  try {
    // If value is already in percentage format (0-100)
    if (value > 1) {
      return `${value.toFixed(2)}%`;
    }
    // If value is in decimal format (0-1)
    return `${(value * 100).toFixed(2)}%`;
  } catch (error) {
    console.error(`Erreur lors du formatage du pourcentage: ${value}`, error);
    return "-";
  }
};
