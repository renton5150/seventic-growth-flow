
/**
 * This is a placeholder utility file for Acelle campaign related functions
 */

export const translateStatus = (status: string): string => {
  switch (status) {
    case "queued":
      return "En attente";
    case "sending":
      return "En cours d'envoi";
    case "sent":
      return "Envoyé";
    case "paused":
      return "En pause";
    case "failed":
      return "Échec";
    default:
      return "Inconnu";
  }
};

export const getStatusBadgeVariant = (status: string): string => {
  switch (status) {
    case "sent":
      return "success";
    case "sending":
      return "info";
    case "queued":
      return "warning";
    case "paused":
      return "warning";
    case "failed":
      return "destructive";
    default:
      return "default";
  }
};

export const renderPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return "0%";
  }
  return `${(value * 100).toFixed(1)}%`;
};

export const safeDeliveryInfo = (campaign: any): any => {
  const defaultInfo = {
    total: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: { total: 0, hard: 0, soft: 0 },
    unsubscribed: 0,
    complained: 0,
    delivery_rate: 0,
    open_rate: 0,
    click_rate: 0,
    unsubscribe_rate: 0,
    unique_open_rate: 0
  };

  return campaign?.delivery_info || defaultInfo;
};

export const isConnectionError = (error: any): boolean => {
  if (!error) return false;
  
  const errorStr = typeof error === 'string' ? error : JSON.stringify(error);
  return errorStr.toLowerCase().includes('connect') || 
         errorStr.toLowerCase().includes('network') || 
         errorStr.toLowerCase().includes('fetch') ||
         errorStr.toLowerCase().includes('404') ||
         errorStr.toLowerCase().includes('403');
};

export const getTroubleshootingMessage = (error: string | null, apiEndpoint?: string): string => {
  return "Email campaign functionality has been removed from the application.";
};
