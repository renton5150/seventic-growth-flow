
import React from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

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
  onPageChange,
}: CampaignsTablePaginationProps) => {
  // Générer un tableau de numéros de page à afficher
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Si le nombre total de pages est inférieur ou égal au nombre maximum à afficher,
      // afficher toutes les pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Toujours inclure la première page
      pageNumbers.push(1);
      
      // Calculer les pages intermédiaires à afficher
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Ajuster si nous sommes près du début
      if (currentPage <= 3) {
        endPage = Math.min(totalPages - 1, 4);
      }
      
      // Ajuster si nous sommes près de la fin
      if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 3);
      }
      
      // Ajouter des ellipses si nécessaire
      if (startPage > 2) {
        pageNumbers.push('...');
      }
      
      // Ajouter les pages intermédiaires
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Ajouter des ellipses si nécessaire
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      // Toujours inclure la dernière page si elle n'est pas déjà incluse
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-gray-500">
        Page {currentPage} sur {totalPages}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {typeof page === 'number' ? (
              <Button
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            ) : (
              <span className="px-2">...</span>
            )}
          </React.Fragment>
        ))}
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
