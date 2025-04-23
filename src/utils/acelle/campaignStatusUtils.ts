
export const translateStatus = (status: string) => {
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

export const getStatusBadgeVariant = (status: string) => {
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

export const renderPercentage = (value: number | undefined) => {
  if (value === undefined) return "N/A";
  return `${(value * 100).toFixed(1)}%`;
};
