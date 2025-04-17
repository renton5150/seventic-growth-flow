
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RequestsTableHeaderProps {
  missionView?: boolean;
  handleSort?: (column: string) => void;
  showSdr?: boolean;
}

export const RequestsTableHeader = ({ missionView = false, handleSort, showSdr = false }: RequestsTableHeaderProps) => {
  const renderSortArrow = (column: string) => {
    if (!handleSort) return null;
    return (
      <Button variant="ghost" size="sm" className="p-0" onClick={() => handleSort(column)}>
        <ChevronDown className="h-3 w-3" />
      </Button>
    );
  };

  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[50px]">Type</TableHead>
        <TableHead className="w-[220px]">
          Titre {renderSortArrow("title")}
        </TableHead>
        <TableHead className="w-[150px]">Demandes</TableHead>
        {!missionView && <TableHead>Mission</TableHead>}
        {showSdr && <TableHead>SDR</TableHead>}
        <TableHead className="w-[120px]">
          Échéance {renderSortArrow("dueDate")}
        </TableHead>
        <TableHead className="w-[150px]">
          Statut {renderSortArrow("status")}
        </TableHead>
        <TableHead className="w-[150px]">
          Assigné à
        </TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};
