
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TablePaginationProps {
  currentPage: number;
  onPageChange: (page: number) => void;
  hasNextPage?: boolean;
  totalPages?: number;
}

export const CampaignsTablePagination = ({
  currentPage,
  onPageChange,
  hasNextPage = false,
  totalPages = 0
}: TablePaginationProps) => {
  return (
    <div className="flex items-center justify-end space-x-2 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Page précédente</span>
      </Button>
      <div className="text-sm text-muted-foreground">
        Page <span className="font-medium">{currentPage}</span>
        {totalPages > 0 && (
          <> sur <span className="font-medium">{totalPages}</span></>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={totalPages > 0 ? currentPage >= totalPages : !hasNextPage}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Page suivante</span>
      </Button>
    </div>
  );
};
