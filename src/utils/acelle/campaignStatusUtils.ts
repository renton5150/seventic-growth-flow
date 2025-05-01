
// Utility functions for Acelle campaign status handling

/**
 * Translates Acelle campaign statuses to French
 */
export const translateStatus = (status: string): string => {
  const cleanStatus = status?.toLowerCase().trim() || 'unknown';
  
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
  const cleanStatus = status?.toLowerCase().trim() || 'unknown';
  
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
 * Safely formats percentages for display with improved robustness
 */
export const renderPercentage = (value: number | undefined | null): string => {
  // Log détaillé pour le débogage
  console.debug(`Formatage du pourcentage: type=${typeof value}, value=${value}`);
  
  if (value === undefined || value === null) return "-";
  
  // Ensure value is a number
  const numValue = Number(value);
  if (isNaN(numValue)) {
    console.warn(`Valeur de pourcentage non numérique: ${value}`);
    return "-";
  }
  
  try {
    // If already 0 or negative, show as-is
    if (numValue <= 0) return "0.00%";
    
    // If value is already in percentage format (>= 1)
    if (numValue >= 1 && numValue <= 100) {
      return `${numValue.toFixed(2)}%`;
    }
    // If value is in decimal format (< 1)
    else if (numValue < 1) {
      return `${(numValue * 100).toFixed(2)}%`;
    }
    // If value is unexpectedly large, cap at 100%
    else {
      console.warn(`Valeur de pourcentage anormalement grande: ${numValue}`);
      return "100.00%";
    }
  } catch (error) {
    console.error(`Erreur lors du formatage du pourcentage: ${value}`, error);
    return "-";
  }
};
