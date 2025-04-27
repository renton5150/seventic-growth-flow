
// Utilitaires de statuts pour les campagnes Acelle (version placeholder)

export const getCampaignStatusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'sent':
    case 'done':
      return 'success';
    case 'sending':
      return 'warning';
    case 'paused':
    case 'scheduled':
      return 'info';
    case 'error':
    case 'failed':
      return 'destructive';
    default:
      return 'outline';
  }
};

export const getCampaignStats = () => {
  return {
    total: 0,
    sent: 0,
    pending: 0,
    active: 0,
    failed: 0
  };
};

export const getFormattedStatus = (status: string) => {
  switch (status.toLowerCase()) {
    case 'sent':
      return 'Envoyé';
    case 'sending':
      return 'En cours d\'envoi';
    case 'paused':
      return 'En pause';
    case 'scheduled':
      return 'Planifié';
    case 'error':
    case 'failed':
      return 'Échoué';
    case 'deleted':
      return 'Supprimé';
    case 'draft':
      return 'Brouillon';
    default:
      return status;
  }
};

export const getCampaignStatusGroups = () => {
  return {
    all: 0,
    active: 0,
    completed: 0,
    failed: 0,
    scheduled: 0
  };
};
