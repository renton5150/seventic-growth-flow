
import { AcelleCampaignDeliveryInfo } from "@/types/acelle.types";

export const translateStatus = (status: string): string => {
  switch (status.toLowerCase()) {
    case "queuing":
      return "En file d'attente";
    case "queued":
      return "En file d'attente";
    case "sending":
      return "En cours d'envoi";
    case "sent":
      return "Envoyé";
    case "ready":
      return "Prêt à envoyer";
    case "failed":
      return "Échec";
    case "paused":
      return "En pause";
    case "draft":
      return "Brouillon";
    case "scheduled":
      return "Programmé";
    default:
      return status;
  }
};

export const getStatusBadgeVariant = (status: string): string => {
  switch (status.toLowerCase()) {
    case "queuing":
    case "queued":
      return "secondary";
    case "sending":
      return "default";
    case "sent":
      return "success";
    case "ready":
      return "outline";
    case "failed":
      return "destructive";
    case "paused":
      return "warning";
    case "draft":
      return "outline";
    case "scheduled":
      return "secondary";
    default:
      return "outline";
  }
};

export const renderPercentage = (value: number): string => {
  if (value === null || value === undefined) return "0%";
  
  // Ensure the value is a number
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // If the value is already a percentage (less than 1), multiply by 100
  const percentage = numValue <= 1 ? numValue * 100 : numValue;
  
  return `${percentage.toFixed(1)}%`;
};

export const safeDeliveryInfo = (deliveryInfo?: AcelleCampaignDeliveryInfo | null): AcelleCampaignDeliveryInfo => {
  return {
    total: deliveryInfo?.total || 0,
    delivery_rate: deliveryInfo?.delivery_rate || 0,
    unique_open_rate: deliveryInfo?.unique_open_rate || 0,
    click_rate: deliveryInfo?.click_rate || 0,
    bounce_rate: deliveryInfo?.bounce_rate || 0,
    unsubscribe_rate: deliveryInfo?.unsubscribe_rate || 0,
    delivered: deliveryInfo?.delivered || 0,
    opened: deliveryInfo?.opened || 0,
    clicked: deliveryInfo?.clicked || 0,
    bounced: {
      soft: deliveryInfo?.bounced?.soft || 0,
      hard: deliveryInfo?.bounced?.hard || 0,
      total: deliveryInfo?.bounced?.total || 0
    },
    unsubscribed: deliveryInfo?.unsubscribed || 0,
    complained: deliveryInfo?.complained || 0
  };
};

export const isConnectionError = (error: string): boolean => {
  const connectionErrors = [
    "failed to fetch",
    "network error",
    "timeout",
    "connection failed",
    "cannot connect",
    "service unavailable",
    "no response",
    "refused to connect"
  ];
  return connectionErrors.some(e => error.toLowerCase().includes(e));
};

export const getTroubleshootingMessage = (error: string): string => {
  if (isConnectionError(error)) {
    return "Les services Acelle semblent indisponibles. Cela peut être dû à une maintenance ou à une panne temporaire.";
  }
  if (error.includes("401") || error.includes("unauthorized")) {
    return "Problème d'authentification avec l'API Acelle. Vérifiez votre token API.";
  }
  if (error.includes("404") || error.includes("not found")) {
    return "Ressource introuvable. L'URL de l'API est peut-être incorrecte.";
  }
  if (error.includes("500") || error.includes("server error")) {
    return "Erreur interne du serveur Acelle. Veuillez contacter l'administrateur de votre instance Acelle.";
  }
  return "Une erreur s'est produite lors de la communication avec l'API Acelle.";
};
