
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
