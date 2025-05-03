
import React from "react";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";

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
  // Calculer les pages à afficher (max 5 pages)
  const renderPageNumbers = () => {
    if (!totalPages || totalPages <= 1) return null;
    
    // Calculer la plage de pages à afficher
    let startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(startPage + 4, totalPages);
    
    // Ajuster la page de départ si nécessaire pour toujours afficher 5 pages
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }
    
    // Créer un tableau de numéros de page à afficher
    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers.map(pageNum => (
      <PaginationItem key={pageNum}>
        <PaginationLink 
          isActive={currentPage === pageNum}
          onClick={() => onPageChange(pageNum)}
        >
          {pageNum}
        </PaginationLink>
      </PaginationItem>
    ));
  };

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious 
            onClick={() => onPageChange(currentPage - 1)}
            aria-disabled={currentPage <= 1}
            className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>
        
        {renderPageNumbers()}
        
        <PaginationItem>
          <PaginationNext 
            onClick={() => onPageChange(currentPage + 1)}
            aria-disabled={totalPages ? currentPage >= totalPages : !hasNextPage}
            className={(totalPages ? currentPage >= totalPages : !hasNextPage) 
              ? "pointer-events-none opacity-50" 
              : "cursor-pointer"}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
