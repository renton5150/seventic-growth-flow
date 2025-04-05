
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface RequestsTableHeaderProps {
  missionView?: boolean;
  handleSort: (column: string) => void;
}

export const RequestsTableHeader = ({ missionView = false, handleSort }: RequestsTableHeaderProps) => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead 
          className="w-[50px] text-center" 
          onClick={() => handleSort("type")}
        >
          Type
        </TableHead>
        <TableHead 
          onClick={() => handleSort("title")}
        >
          Titre
        </TableHead>
        {!missionView && (
          <TableHead>Mission</TableHead>
        )}
        <TableHead 
          onClick={() => handleSort("dueDate")}
        >
          Date prévue
        </TableHead>
        <TableHead 
          onClick={() => handleSort("status")}
        >
          Statut
        </TableHead>
        <TableHead className="w-[100px] text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};
