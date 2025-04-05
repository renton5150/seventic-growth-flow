
import { TableBody, TableCell, TableRow } from "@/components/ui/table";

interface EmptyRequestsRowProps {
  missionView?: boolean;
}

export const EmptyRequestsRow = ({ missionView = false }: EmptyRequestsRowProps) => {
  return (
    <TableBody>
      <TableRow>
        <TableCell colSpan={missionView ? 5 : 6} className="text-center py-10 text-muted-foreground">
          Aucune demande pour le moment
        </TableCell>
      </TableRow>
    </TableBody>
  );
};
