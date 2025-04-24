
export const translateStatus = (status: string): string => {
  switch (status) {
    case "new": return "Nouveau";
    case "queued": return "En attente";
    case "sending": return "En envoi";
    case "sent": return "Envoyé";
    case "paused": return "En pause";
    case "failed": return "Échoué";
    default: return status;
  }
};

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

export const renderPercentage = (value: number | undefined): string => {
  if (value === undefined) return "0%";
  return `${(value * 100).toFixed(1)}%`;
};
