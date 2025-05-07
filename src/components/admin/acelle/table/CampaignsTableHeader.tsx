
import { TableHead } from "@/components/ui/table";
import { ArrowDown, ArrowUp } from "lucide-react";

interface Column {
  key: string;
  label: string;
}

interface CampaignsTableHeaderProps {
  columns: Column[];
  sortBy: string;
  sortOrder: string;
  onSort: (columnKey: string) => void;
}

export const CampaignsTableHeader: React.FC<CampaignsTableHeaderProps> = ({
  columns,
  sortBy,
  sortOrder,
  onSort,
}) => {
  return (
    <>
      {columns.map((column) => (
        <TableHead 
          key={column.key}
          className={
            column.key ? "cursor-pointer hover:bg-muted/50" : "cursor-default"
          }
          onClick={() => column.key ? onSort(column.key) : null}
        >
          <div className="flex items-center space-x-1">
            <span>{column.label}</span>
            {sortBy === column.key && (
              <span className="flex-shrink-0">
                {sortOrder === "asc" ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
              </span>
            )}
          </div>
        </TableHead>
      ))}
    </>
  );
};
