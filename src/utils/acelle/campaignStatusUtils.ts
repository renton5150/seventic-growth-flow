
export const translateStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    new: "Nouveau",
    queuing: "En file d'attente",
    queued: "En file d'attente",
    sending: "En cours d'envoi",
    sent: "Envoyé",
    failed: "Échoué",
    ready: "Prêt",
    paused: "En pause",
    done: "Terminé",
    rejected: "Rejeté",
    delivered: "Livré",
    bounced: "Rebond",
    undelivered: "Non livré",
    unsubscribed: "Désabonné",
    opened: "Ouvert",
    clicked: "Cliqué",
    aborted: "Annulé",
    cancelled: "Annulé",
    scheduled: "Planifié",
    draft: "Brouillon",
  };

  return statusMap[status.toLowerCase()] || status;
};

export const getStatusBadgeVariant = (status: string): string => {
  const lowerStatus = status.toLowerCase();

  if (["sent", "done", "delivered", "opened", "clicked"].includes(lowerStatus)) {
    return "success";
  }

  if (["sending", "queuing", "queued", "scheduled"].includes(lowerStatus)) {
    return "primary";
  }

  if (["new", "ready", "paused", "draft"].includes(lowerStatus)) {
    return "warning";
  }

  if (["failed", "bounced", "undelivered", "rejected", "aborted", "cancelled", "unsubscribed"].includes(lowerStatus)) {
    return "danger";
  }

  return "default";
};

export const renderPercentage = (value: number): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return "0%";
  }
  
  // If value is already between 0 and 1
  if (value >= 0 && value <= 1) {
    return `${(value * 100).toFixed(1)}%`;
  }
  
  // If value is already represented as percentage (0-100)
  return `${value.toFixed(1)}%`;
};

// Function to help troubleshoot connection errors
export const getTroubleshootingMessage = (error: Error): string => {
  if (isConnectionError(error)) {
    return "Problème de connexion à l'API Acelle. Veuillez vérifier que le point d'accès API est correct et accessible.";
  }
  
  if (error.message.includes("401") || error.message.includes("unauthorized")) {
    return "Erreur d'authentification. Veuillez vérifier votre jeton API.";
  }
  
  return "Erreur lors de la communication avec l'API Acelle. Veuillez réessayer plus tard.";
};

export const isConnectionError = (error: Error): boolean => {
  const message = error.message.toLowerCase();
  return (
    message.includes("network") ||
    message.includes("connection") ||
    message.includes("connect") ||
    message.includes("cors") ||
    message.includes("cross-origin") ||
    message.includes("fetch") ||
    message.includes("timeout")
  );
};
