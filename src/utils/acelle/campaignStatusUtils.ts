
export const translateStatus = (status: string): string => {
  switch (status) {
    case "new": return "Nouveau";
    case "queued": return "En attente";
    case "sending": return "En cours d'envoi";
    case "sent": return "Envoyé";
    case "paused": return "En pause";
    case "failed": return "Échoué";
    default: return status || "Inconnu";
  }
};

export const getStatusBadgeVariant = (status: string): string => {
  switch (status) {
    case "new": return "secondary";
    case "queued": return "warning";
    case "sending": return "default";
    case "sent": return "success";
    case "paused": return "outline";
    case "failed": return "destructive";
    default: return "secondary";
  }
};

export const renderPercentage = (value: number | undefined): string => {
  if (value === undefined || value === null) return "0%";
  return `${(value * 100).toFixed(1)}%`;
};

export const safeDeliveryInfo = (info: any = {}) => {
  return {
    total: info.total || 0,
    delivered: info.delivered || 0,
    delivery_rate: info.delivery_rate || 0,
    opened: info.opened || 0,
    unique_open_rate: info.unique_open_rate || 0,
    clicked: info.clicked || 0,
    click_rate: info.click_rate || 0,
    bounced: {
      soft: info.bounced?.soft || 0,
      hard: info.bounced?.hard || 0,
      total: info.bounced?.total || 0
    },
    bounce_rate: info.bounce_rate || 0,
    unsubscribed: info.unsubscribed || 0,
    unsubscribe_rate: info.unsubscribe_rate || 0,
    complained: info.complained || 0
  };
};

export const isConnectionError = (error: any): boolean => {
  if (!error) return false;
  const errorMsg = typeof error === 'string' ? error : error.message || '';
  return errorMsg.includes('Failed to fetch') || 
         errorMsg.includes('timeout') || 
         errorMsg.includes('network') ||
         errorMsg.includes('connection') ||
         errorMsg.includes('ECONNREFUSED');
};

export const getTroubleshootingMessage = (error: any): string => {
  if (!error) return "";
  if (isConnectionError(error)) {
    return "Les services semblent être en cours de démarrage ou indisponibles. Veuillez patienter ou cliquer sur 'Réveiller les services'.";
  }
  return typeof error === 'string' ? error : error.message || "Une erreur est survenue";
};
