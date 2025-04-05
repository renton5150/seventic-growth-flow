
import { TableCell, TableRow } from "@/components/ui/table";

interface EmptyRequestsRowProps {
  colSpan: number;
  missionView?: boolean;
}

export const EmptyRequestsRow = ({ colSpan, missionView = false }: EmptyRequestsRowProps) => {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center py-10 text-muted-foreground">
        Aucune demande pour le moment
      </TableCell>
    </TableRow>
  );
};
