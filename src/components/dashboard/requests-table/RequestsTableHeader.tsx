
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface RequestsTableHeaderProps {
  missionView?: boolean;
  handleSort: (column: string) => void;
  showSdr?: boolean;
  isSDR?: boolean;
}

export const RequestsTableHeader = ({ 
  missionView = false, 
  handleSort,
  showSdr = false,
  isSDR = false
}: RequestsTableHeaderProps) => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[100px]">Type</TableHead>
        <TableHead 
          className="cursor-pointer" 
          onClick={() => handleSort("title")}
        >
          Titre
        </TableHead>
        
        {!missionView && (
          <TableHead 
            className={`cursor-pointer ${isSDR ? 'hidden' : ''}`}
            onClick={() => handleSort("missionName")}
          >
            Mission
          </TableHead>
        )}
        
        {showSdr && (
          <TableHead 
            className="cursor-pointer" 
            onClick={() => handleSort("sdrName")}
          >
            SDR
          </TableHead>
        )}
        
        <TableHead 
          className="cursor-pointer" 
          onClick={() => handleSort("status")}
        >
          Statut
        </TableHead>
        
        <TableHead 
          className="cursor-pointer" 
          onClick={() => handleSort("dueDate")}
        >
          Échéance
        </TableHead>
        
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};
