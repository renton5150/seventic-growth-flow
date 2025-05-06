
import React from "react";
import { TableHead } from "@/components/ui/table";
import { ArrowDown, ArrowUp } from "lucide-react";

interface Column {
  key: string;
  label: string;
}

interface CampaignsTableHeaderProps {
  columns: Column[];
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (column: string) => void;
}

export const CampaignsTableHeader = ({
  columns,
  sortBy,
  sortOrder,
  onSort
}: CampaignsTableHeaderProps) => {
  const getSortIndicator = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const getSortableHeader = (column: Column) => {
    const isSortable = [
      "name", 
      "subject", 
      "status", 
      "delivery_date", 
      "subscriber_count", 
      "open_rate", 
      "click_rate",
      "bounce_count",
      "last_updated"
    ].includes(column.key);
    
    const content = (
      <div className="flex items-center space-x-2">
        <span>{column.label}</span>
        {getSortIndicator(column.key)}
      </div>
    );
    
    if (!isSortable) return content;
    
    return (
      <button
        className="flex items-center space-x-1 focus:outline-none"
        onClick={() => onSort(column.key)}
      >
        {content}
      </button>
    );
  };
  
  return (
    <>
      {columns.map((column) => (
        <TableHead 
          key={column.key}
          className={column.key === "name" ? "w-[250px]" : ""}
        >
          {getSortableHeader(column)}
        </TableHead>
      ))}
    </>
  );
};
