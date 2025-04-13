
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";

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
  setPageSize
}: MissionsPaginationProps) => {
  // Pas besoin de pagination si on a une seule page
  if (totalPages <= 1) return null;
  
  // Fonction pour générer les numéros de page à afficher
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Afficher toutes les pages si leur nombre est inférieur à maxPagesToShow
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Afficher les pages avec ellipsis
      if (currentPage <= 3) {
        // Premières pages
        for (let i = 1; i <= 3; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("ellipsis");
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Dernières pages
        pageNumbers.push(1);
        pageNumbers.push("ellipsis");
        for (let i = totalPages - 2; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // Pages du milieu
        pageNumbers.push(1);
        pageNumbers.push("ellipsis");
        pageNumbers.push(currentPage - 1);
        pageNumbers.push(currentPage);
        pageNumbers.push(currentPage + 1);
        pageNumbers.push("ellipsis");
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };
  
  const pageNumbers = getPageNumbers();
  const startingItem = (currentPage - 1) * pageSize + 1;
  const endingItem = Math.min(currentPage * pageSize, totalItems);
  
  return (
    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between">
      <div className="text-sm text-muted-foreground mb-4 sm:mb-0">
        Affichage de <span className="font-medium">{startingItem}</span> à{" "}
        <span className="font-medium">{endingItem}</span> sur{" "}
        <span className="font-medium">{totalItems}</span> missions
      </div>
      
      <div className="flex items-center gap-4">
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => setPageSize(parseInt(value))}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 par page</SelectItem>
            <SelectItem value="10">10 par page</SelectItem>
            <SelectItem value="20">20 par page</SelectItem>
            <SelectItem value="50">50 par page</SelectItem>
          </SelectContent>
        </Select>
        
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={prevPage}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {pageNumbers.map((page, index) => (
              page === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={`page-${page}`}>
                  <PaginationLink
                    isActive={currentPage === page}
                    onClick={() => goToPage(page as number)}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            ))}
            
            <PaginationItem>
              <PaginationNext
                onClick={nextPage}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};
