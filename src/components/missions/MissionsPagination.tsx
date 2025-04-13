
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MissionsPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
}

export const MissionsPagination = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  goToPage,
  nextPage,
  prevPage,
  setPageSize,
}: MissionsPaginationProps) => {
  // Pas besoin de pagination si moins d'une page
  if (totalPages <= 1) {
    return (
      <div className="flex justify-between items-center py-2 text-sm text-muted-foreground">
        <div>
          {totalItems} mission{totalItems !== 1 ? "s" : ""}
        </div>
        <div></div>
      </div>
    );
  }

  // Générer les boutons de page
  const renderPageButtons = () => {
    const pageButtons = [];
    const maxVisiblePages = 5;
    
    // Toujours afficher la première page
    if (currentPage > 3) {
      pageButtons.push(
        <Button
          key={1}
          variant={currentPage === 1 ? "default" : "outline"}
          size="sm"
          onClick={() => goToPage(1)}
        >
          1
        </Button>
      );
      
      // Afficher les points de suspension si on n'est pas proche du début
      if (currentPage > 4) {
        pageButtons.push(
          <span key="ellipsis1" className="px-2">
            ...
          </span>
        );
      }
    }
    
    // Pages autour de la page actuelle
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    for (let i = startPage; i <= endPage; i++) {
      // Ne pas dupliquer la première et la dernière page
      if (i === 1 && currentPage <= 3) {
        pageButtons.push(
          <Button
            key={i}
            variant={currentPage === i ? "default" : "outline"}
            size="sm"
            onClick={() => goToPage(i)}
          >
            {i}
          </Button>
        );
      } else if (i === totalPages && currentPage >= totalPages - 2) {
        // Ne rien faire, on va l'ajouter plus tard
      } else if (i !== 1 && i !== totalPages) {
        pageButtons.push(
          <Button
            key={i}
            variant={currentPage === i ? "default" : "outline"}
            size="sm"
            onClick={() => goToPage(i)}
          >
            {i}
          </Button>
        );
      }
    }
    
    // Ajouter les points de suspension si on n'est pas proche de la fin
    if (currentPage < totalPages - 3) {
      pageButtons.push(
        <span key="ellipsis2" className="px-2">
          ...
        </span>
      );
    }
    
    // Toujours afficher la dernière page
    if (currentPage < totalPages - 1) {
      pageButtons.push(
        <Button
          key={totalPages}
          variant={currentPage === totalPages ? "default" : "outline"}
          size="sm"
          onClick={() => goToPage(totalPages)}
        >
          {totalPages}
        </Button>
      );
    }
    
    return pageButtons;
  };

  return (
    <div className="flex flex-col xs:flex-row justify-between items-center pt-4 space-y-3 xs:space-y-0">
      <div className="text-sm text-muted-foreground">
        Affichage des résultats {(currentPage - 1) * pageSize + 1} à{" "}
        {Math.min(currentPage * pageSize, totalItems)} sur {totalItems}
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={prevPage}
            disabled={currentPage === 1}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Page précédente</span>
          </Button>
          
          <div className="hidden sm:flex space-x-2">
            {renderPageButtons()}
          </div>
          
          <div className="sm:hidden">
            <span className="text-sm">
              {currentPage} / {totalPages}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Page suivante</span>
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Par page:
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => setPageSize(Number(value))}
          >
            <SelectTrigger className="h-8 w-16">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
