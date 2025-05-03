
import React from "react";
import { CampaignsTablePagination } from "../table/TablePagination";

interface TableFooterProps {
  currentPage: number;
  onPageChange: (page: number) => void;
  hasNextPage: boolean;
  totalPages: number;
}

export function TableFooter({
  currentPage,
  onPageChange,
  hasNextPage,
  totalPages
}: TableFooterProps) {
  return (
    <div className="flex justify-end mt-4">
      <CampaignsTablePagination 
        currentPage={currentPage}
        onPageChange={onPageChange}
        hasNextPage={hasNextPage}
        totalPages={totalPages}
      />
    </div>
  );
}
