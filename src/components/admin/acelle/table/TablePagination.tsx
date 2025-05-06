
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface CampaignsTablePaginationProps {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
}

export const CampaignsTablePagination = ({
  currentPage,
  totalPages,
  hasNextPage,
  onPageChange
}: CampaignsTablePaginationProps) => {
  return (
    <div className="flex items-center justify-end space-x-2 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage <= 1}
        className="h-8 w-8 p-0"
      >
        <span className="sr-only">Page précédente</span>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium">
          Page {currentPage} sur {totalPages}
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNextPage}
        className="h-8 w-8 p-0"
      >
        <span className="sr-only">Page suivante</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
