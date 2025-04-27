
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface TablePaginationProps {
  currentPage: number;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
}

export const CampaignsTablePagination = ({
  currentPage,
  hasNextPage,
  onPageChange,
}: TablePaginationProps) => {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              if (currentPage > 1) onPageChange(currentPage - 1);
            }}
            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
        
        {[...Array(Math.min(3, currentPage))].map((_, i) => {
          const pageNumber = currentPage - (Math.min(3, currentPage) - i);
          return (
            <PaginationItem key={`prev-${pageNumber}`}>
              <PaginationLink 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(pageNumber);
                }}
                isActive={pageNumber === currentPage}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          );
        })}
        
        {currentPage + 1 <= 10 && (
          <PaginationItem>
            <PaginationLink 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                onPageChange(currentPage + 1);
              }}
            >
              {currentPage + 1}
            </PaginationLink>
          </PaginationItem>
        )}
        
        {currentPage + 2 <= 10 && (
          <PaginationItem>
            <PaginationLink 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                onPageChange(currentPage + 2);
              }}
            >
              {currentPage + 2}
            </PaginationLink>
          </PaginationItem>
        )}
        
        <PaginationItem>
          <PaginationNext 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              if (hasNextPage) {
                onPageChange(currentPage + 1);
              }
            }}
            className={!hasNextPage ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
