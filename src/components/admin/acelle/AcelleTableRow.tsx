
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Edit, RefreshCw, Trash } from "lucide-react";
import { AcelleAccount } from "@/types/acelle.types";

interface AcelleTableRowProps {
  account: AcelleAccount;
  onEdit?: (account: AcelleAccount) => void;
  onSync?: (account: AcelleAccount) => void;
  onDelete?: (account: AcelleAccount) => void;
}

export const AcelleTableRow: React.FC<AcelleTableRowProps> = ({
  account,
  onEdit,
  onSync,
  onDelete,
}) => {
  // Format dates for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Jamais";
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: fr });
    } catch {
      return "Date invalide";
    }
  };

  // Return the appropriate badge color based on account status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 hover:bg-green-600">Actif</Badge>;
      case "inactive":
        return <Badge variant="outline">Inactif</Badge>;
      case "error":
        return <Badge variant="destructive">Erreur</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <TableRow key={account.id}>
      <TableCell className="font-medium">{account.name}</TableCell>
      <TableCell className="max-w-[200px] truncate" title={account.api_endpoint}>
        {account.api_endpoint}
      </TableCell>
      <TableCell>{getStatusBadge(account.status)}</TableCell>
      <TableCell>{formatDate(account.created_at)}</TableCell>
      <TableCell>{formatDate(account.last_sync_date)}</TableCell>
      <TableCell className="text-right space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit?.(account)}
          title="Modifier"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onSync?.(account)}
          title="Synchroniser"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete?.(account)}
          title="Supprimer"
          className="text-red-500 hover:text-red-700"
        >
          <Trash className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};
