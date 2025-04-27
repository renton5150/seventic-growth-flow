
// Fonction pour traduire les statuts en français
export const translateStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    "draft": "Brouillon",
    "queued": "En file",
    "sending": "En cours d'envoi",
    "sent": "Envoyé",
    "failed": "Échoué",
    "paused": "En pause",
    "scheduled": "Programmé",
    "ready": "Prêt",
    "new": "Nouveau"
  };
  
  return statusMap[status.toLowerCase()] || status;
};

// Fonction pour obtenir la variante de badge selon le statut
export const getStatusBadgeVariant = (status: string): string => {
  const lowerStatus = status.toLowerCase();
  
  if (lowerStatus === "sent" || lowerStatus === "ready") return "success";
  if (lowerStatus === "sending" || lowerStatus === "queued") return "default";
  if (lowerStatus === "failed") return "destructive";
  if (lowerStatus === "paused") return "outline";
  if (lowerStatus === "scheduled") return "secondary";
  if (lowerStatus === "draft" || lowerStatus === "new") return "outline";
  
  return "secondary";
};

// Helper to render percentage values safely
export const renderPercentage = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return "0%";
  
  // Convert value to percentage with one decimal place
  const percentage = (value * 100).toFixed(1);
  return `${percentage}%`;
};

// Helper to get default delivery info structure with safe values
export const getDefaultDeliveryInfo = () => ({
  total: 0,
  delivery_rate: 0,
  unique_open_rate: 0,
  click_rate: 0,
  bounce_rate: 0,
  unsubscribe_rate: 0,
  delivered: 0,
  opened: 0,
  clicked: 0,
  bounced: {
    soft: 0,
    hard: 0,
    total: 0
  },
  unsubscribed: 0,
  complained: 0
});

// Helper to safely access delivery_info properties
export const safeDeliveryInfo = (campaign: any) => {
  if (!campaign) return getDefaultDeliveryInfo();
  return campaign.delivery_info || getDefaultDeliveryInfo();
};

// New function to format API error messages for display
export const formatApiErrorMessage = (error: any): string => {
  if (!error) return "Erreur inconnue";
  
  // Check for common API access errors
  if (error.message && error.message.includes("403")) {
    return "Accès API refusé (403 Forbidden). Vérifiez les identifiants et autorisations.";
  }
  
  if (error.message && error.message.includes("404")) {
    return "API introuvable (404). Vérifiez l'URL de l'API.";
  }
  
  if (error.message && (error.message.includes("timeout") || error.message.includes("délai"))) {
    return "Délai de connexion dépassé. L'API est peut-être indisponible ou surchargée.";
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return error.message || error.error || "Erreur de connexion à l'API";
};

// Function to check if an API error is related to connection issues
export const isConnectionError = (error: any): boolean => {
  if (!error) return false;
  
  const errorStr = typeof error === 'string' 
    ? error.toLowerCase() 
    : JSON.stringify(error).toLowerCase();
  
  return errorStr.includes("forbidden") || 
         errorStr.includes("403") ||
         errorStr.includes("access") ||
         errorStr.includes("inaccessible") ||
         errorStr.includes("connexion") ||
         errorStr.includes("timeout") ||
         errorStr.includes("délai") ||
         errorStr.includes("indisponible");
};

// Function to get a detailed troubleshooting message for API connection errors
export const getTroubleshootingMessage = (error: any, endpoint?: string): string => {
  let message = "Problème de connexion à l'API Acelle Mail. ";
  
  if (endpoint) {
    message += `URL: ${endpoint}. `;
  }
  
  if (error && (error.status === 403 || (typeof error === 'string' && error.includes("403")))) {
    message += "L'erreur 403 Forbidden indique un problème d'autorisation. Vérifiez:\n";
    message += "1. Que votre token API est valide et non expiré\n";
    message += "2. Que l'adresse IP du serveur n'est pas bloquée\n";
    message += "3. Que les paramètres de sécurité d'Acelle Mail autorisent l'accès API";
  } else {
    message += "Pour résoudre ce problème, vérifiez:\n";
    message += "1. La connectivité à l'URL de l'API\n";
    message += "2. La validité de votre token API\n";
    message += "3. Les restrictions d'accès sur votre serveur Acelle";
  }
  
  return message;
};
