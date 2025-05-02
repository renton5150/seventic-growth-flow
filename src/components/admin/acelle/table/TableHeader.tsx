
import React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export interface TableHeaderProps {
  columns: Array<{
    key: string;
    label: string;
  }>;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (column: string) => void;
}

export const CampaignsTableHeader = ({
  columns,
  sortBy,
  sortOrder,
  onSort
}: TableHeaderProps) => {
  // Récupérer l'icône appropriée pour l'ordre de tri
  const getSortIcon = (columnKey: string) => {
    if (sortBy !== columnKey) {
      return <ArrowUpDown className="ml-1 h-4 w-4" />;
    }
    return sortOrder === "asc" ? 
      <ArrowUp className="ml-1 h-4 w-4" /> : 
      <ArrowDown className="ml-1 h-4 w-4" />;
  };

  return (
    <>
      {columns.map((column) => (
        <TableHead key={column.key} className={column.key === "" ? "w-[50px]" : ""}>
          {column.key ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 p-0 font-medium text-muted-foreground hover:text-foreground"
              onClick={() => onSort(column.key)}
            >
              {column.label}
              {column.key !== "" && getSortIcon(column.key)}
            </Button>
          ) : (
            column.label
          )}
        </TableHead>
      ))}
    </>
  );
};
