
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
 * Version robuste pour le formatage des pourcentages avec détection intelligente du format
 */
export const renderPercentage = (value: number | undefined | null | string): string => {
  // Cas des valeurs non définies ou nulles
  if (value === undefined || value === null) return "0%";
  
  // Conversion en nombre si c'est une chaîne
  let numValue: number;
  
  if (typeof value === 'string') {
    // Si la chaîne contient déjà un %, on l'enlève avant la conversion
    if (value.includes('%')) {
      numValue = parseFloat(value.replace('%', ''));
    } else {
      numValue = parseFloat(value);
    }
  } else {
    numValue = Number(value);
  }
  
  // Vérification si le nombre est valide
  if (isNaN(numValue)) {
    console.warn(`Valeur de pourcentage invalide: ${value}`);
    return "0%";
  }
  
  try {
    // Détection intelligente du format
    
    // Si c'est déjà un pourcentage (entre 0 et 100)
    if (numValue >= 0 && numValue <= 100) {
      // Si le nombre est très petit mais non-nul, on affiche au moins 0.01%
      if (numValue > 0 && numValue < 0.01) {
        return "0,01%";
      }
      return numValue.toFixed(2).replace('.', ',') + '%';
    }
    // Si c'est une fraction (entre 0 et 1)
    else if (numValue > 0 && numValue < 1) {
      const percentage = numValue * 100;
      // Si le pourcentage est très petit mais non-nul
      if (percentage < 0.01 && percentage > 0) {
        return "0,01%";
      }
      return percentage.toFixed(2).replace('.', ',') + '%';
    }
    // Si le nombre est supérieur à 100 mais pourrait être un multiplieur (10000 = 100%)
    else if (numValue > 100 && numValue <= 10000) {
      // On suppose que c'est un pourcentage multiplié par 100
      const correctedValue = numValue / 100;
      return correctedValue.toFixed(2).replace('.', ',') + '%';
    }
    // En cas de valeur trop grande, nous plafonnons à 100%
    else if (numValue > 10000) {
      return "100,00%";
    } 
    // Cas par défaut: on suppose que c'est déjà un pourcentage
    else {
      return numValue.toFixed(2).replace('.', ',') + '%';
    }
  } catch (error) {
    console.error(`Erreur lors du formatage du pourcentage: ${error}`);
    return "0%";
  }
};
