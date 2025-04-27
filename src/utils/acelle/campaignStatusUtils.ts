
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
