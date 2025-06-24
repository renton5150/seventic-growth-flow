
import { AppLayout } from "@/components/layout/AppLayout";
import { useArchiveRequests } from "@/hooks/useArchiveRequests";
import { useArchiveRequestsFilters } from "@/hooks/useArchiveRequestsFilters";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArchiveRequestsTable } from "@/components/archives/ArchiveRequestsTable";

const Archives = () => {
  const { 
    archivedRequests, 
    allArchivedRequests,
    isLoading, 
    activeTab, 
    setActiveTab, 
    isSDR, 
    isAdmin 
  } = useArchiveRequests();

  // Utiliser le hook de filtres sur les requêtes filtrées par onglet
  const {
    filteredAndSortedRequests,
    sortColumn,
    sortDirection,
    filters,
    dateFilters,
    uniqueValues,
    handleSort,
    handleFilterChange,
    handleDateFilterChange
  } = useArchiveRequestsFilters(archivedRequests);

  console.log("[Archives] Rendu avec:", {
    totalArchived: allArchivedRequests.length,
    filteredByTab: archivedRequests.length,
    finalFiltered: filteredAndSortedRequests.length,
    activeTab
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Archives</h1>
          <p className="mt-2 text-gray-500">
            Consultez toutes les demandes terminées avec tri et filtres.
          </p>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <p>Chargement des archives...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  {filteredAndSortedRequests.length} sur {allArchivedRequests.length} {allArchivedRequests.length > 1 ? 'demandes archivées' : 'demande archivée'}
                  {filteredAndSortedRequests.length !== archivedRequests.length && (
                    <span className="text-blue-600 font-medium"> (filtrées)</span>
                  )}
                </p>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid grid-cols-4 h-auto p-1">
                <TabsTrigger value="all" className="py-2">
                  Toutes
                </TabsTrigger>
                <TabsTrigger value="email" className="py-2">
                  Email
                </TabsTrigger>
                <TabsTrigger value="database" className="py-2">
                  Base de données
                </TabsTrigger>
                <TabsTrigger value="linkedin" className="py-2">
                  LinkedIn
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="mt-6">
                <ArchiveRequestsTable
                  requests={filteredAndSortedRequests}
                  showSdr={!isSDR}
                  isSDR={isSDR}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  filters={filters}
                  dateFilters={dateFilters}
                  uniqueValues={uniqueValues}
                  onSort={handleSort}
                  onFilterChange={handleFilterChange}
                  onDateFilterChange={handleDateFilterChange}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Archives;
