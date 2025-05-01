
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
 * Safely formats percentages for display with enhanced error handling
 */
export const renderPercentage = (value: number | undefined | null): string => {
  // Ignorer les valeurs non définies
  if (value === undefined || value === null) return "-";
  
  // S'assurer que value est un nombre
  const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
  
  // Vérifier si le nombre est valide
  if (isNaN(numValue)) {
    console.warn(`Valeur de pourcentage invalide: ${value}`);
    return "0%";
  }
  
  try {
    // Si le nombre est déjà un pourcentage (entre 0 et 100)
    if (numValue >= 0 && numValue <= 100) {
      return `${numValue.toFixed(2)}%`;
    }
    // Si le nombre est une fraction (entre 0 et 1)
    else if (numValue > 0 && numValue < 1) {
      return `${(numValue * 100).toFixed(2)}%`;
    }
    // Si le nombre est supérieur à 100 mais semble être une fraction multipliée par 10000
    else if (numValue > 100 && numValue < 10000) {
      // Nous essayons de détecter si c'est un pourcentage multiplié par 100
      return `${(numValue / 100).toFixed(2)}%`;
    }
    // En cas de valeur trop grande, nous plafonnons à 100%
    else if (numValue > 10000) {
      console.warn(`Valeur anormalement élevée pour un pourcentage: ${numValue}, plafonnée à 100%`);
      return "100.00%";
    } else {
      // Pour tout autre cas, nous retournons la valeur formatée directement
      return `${numValue.toFixed(2)}%`;
    }
  } catch (error) {
    console.error(`Erreur lors du formatage du pourcentage: ${error}`);
    return "0%";
  }
};
