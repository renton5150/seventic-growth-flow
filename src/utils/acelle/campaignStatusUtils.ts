
/**
 * Utility functions for campaign status formatting and display
 */

// Translate campaign status to French
export const translateStatus = (status: string): string => {
  switch (status) {
    case "new": return "Nouveau";
    case "queued": return "En attente";
    case "sending": return "En cours d'envoi";
    case "sent": return "Envoyé";
    case "paused": return "En pause";
    case "failed": return "Échoué";
    default: return status;
  }
};

// Get appropriate badge variant based on campaign status
export const getStatusBadgeVariant = (status: string): string => {
  switch (status) {
    case "new": return "secondary";
    case "queued": return "outline";
    case "sending": return "default";
    case "sent": return "success";
    case "paused": return "warning";
    case "failed": return "destructive";
    default: return "outline";
  }
};

// Format percentage value for display
export const renderPercentage = (value: number | undefined): string => {
  if (value === undefined || isNaN(value)) return "0%";
  return `${(value * 100).toFixed(1)}%`;
};

// Format statistics with absolute numbers and percentages
export const formatStat = (value: number = 0, total: number = 0): string => {
  const percentage = total > 0 ? (value / total * 100).toFixed(1) : '0';
  return `${value} (${percentage}%)`;
};

// Get safe delivery info object with defaults
export const safeDeliveryInfo = (info: any = {}) => {
  return {
    total: info.total || 0,
    delivery_rate: info.delivery_rate || 0,
    unique_open_rate: info.unique_open_rate || 0,
    click_rate: info.click_rate || 0,
    bounce_rate: info.bounce_rate || 0,
    unsubscribe_rate: info.unsubscribe_rate || 0,
    delivered: info.delivered || 0,
    opened: info.opened || 0,
    clicked: info.clicked || 0,
    bounced: {
      soft: info.bounced?.soft || 0,
      hard: info.bounced?.hard || 0,
      total: info.bounced?.total || 0
    },
    unsubscribed: info.unsubscribed || 0,
    complained: info.complained || 0
  };
};

// Check if an error is related to connection issues
export const isConnectionError = (error: string): boolean => {
  const connectionErrors = [
    "failed to fetch",
    "network error",
    "timeout",
    "connection refused",
    "offline",
    "request timed out",
    "aborted",
    "service unavailable",
    "edge function",
    "initializing"
  ];
  
  if (!error) return false;
  
  return connectionErrors.some(phrase => 
    error.toLowerCase().includes(phrase.toLowerCase())
  );
};

// Get user-friendly troubleshooting message based on error
export const getTroubleshootingMessage = (error: string): string => {
  if (isConnectionError(error)) {
    return "Les services semblent être en cours de démarrage ou temporairement indisponibles. Veuillez patienter ou essayer de réveiller les services.";
  }
  
  if (error.includes("401") || error.includes("unauthorized")) {
    return "Problème d'authentification. Veuillez vérifier les identifiants API ou vous reconnecter.";
  }
  
  if (error.includes("403") || error.includes("forbidden")) {
    return "Accès refusé à l'API. Veuillez vérifier les permissions du compte.";
  }
  
  return error || "Une erreur s'est produite. Veuillez réessayer plus tard.";
};

