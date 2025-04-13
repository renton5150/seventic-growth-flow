
import { useState } from "react";
import { Mission } from "@/types/types";
import { MissionsTable } from "@/components/missions/MissionsTable";
import { MissionsFilter } from "@/components/missions/MissionsFilter";
import { MissionsPagination } from "@/components/missions/MissionsPagination";
import { EmptyMissionState } from "@/components/missions/EmptyMissionState";
import { useMissionsList } from "@/hooks/useMissionsList";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MissionSortField, SortDirection } from "@/hooks/useMissionsList";

interface MissionsListViewProps {
  userId?: string;
  isAdmin?: boolean;
  isSdr?: boolean;
  onCreateMission: () => void;
  onViewMission: (mission: Mission) => void;
  onEditMission?: (mission: Mission) => void;
  onDeleteMission?: (mission: Mission) => void;
  onMissionUpdated?: () => void;
}

export const MissionsListView = ({
  userId,
  isAdmin = false,
  isSdr = false,
  onCreateMission,
  onViewMission,
  onEditMission,
  onDeleteMission,
  onMissionUpdated
}: MissionsListViewProps) => {
  const {
    missions,
    isLoading,
    isError,
    error,
    refetch,
    filters,
    updateFilters,
    sortOptions,
    updateSort,
    pagination
  } = useMissionsList(userId, isAdmin);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={40} className="animate-spin text-primary" />
        <span className="ml-2">Chargement des missions...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>Une erreur est survenue lors du chargement des missions.</p>
          <p className="text-sm opacity-80">{error instanceof Error ? error.message : "Veuillez réessayer ultérieurement."}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            className="w-fit mt-2"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Fonction de tri pour l'en-tête du tableau
  const handleSort = (field: MissionSortField) => {
    updateSort(field);
  };

  return (
    <div className="space-y-4">
      <MissionsFilter 
        filters={filters}
        updateFilters={updateFilters}
        isSdr={isSdr}
      />
      
      {missions.length === 0 ? (
        filters.search || filters.status || filters.type || filters.startDate || filters.endDate ? (
          <div className="text-center py-12 bg-muted/50 rounded-md border">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Aucune mission ne correspond à ces critères</h3>
            <p className="mt-2 text-muted-foreground">
              Essayez de modifier vos filtres ou d'effacer votre recherche.
            </p>
            <Button 
              variant="outline"
              className="mt-4"
              onClick={() => updateFilters({
                search: undefined,
                status: undefined,
                type: undefined,
                startDate: undefined,
                endDate: undefined
              })}
            >
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <EmptyMissionState 
            isSdr={isSdr}
            onCreateMission={onCreateMission}
          />
        )
      ) : (
        <>
          <MissionsTable 
            missions={missions} 
            isAdmin={isAdmin} 
            onViewMission={onViewMission}
            onEditMission={onEditMission}
            onDeleteMission={onDeleteMission}
            onMissionUpdated={onMissionUpdated}
            sortOptions={sortOptions}
            onSort={handleSort}
          />
          
          <MissionsPagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            goToPage={pagination.goToPage}
            nextPage={pagination.nextPage}
            prevPage={pagination.prevPage}
            setPageSize={pagination.setPageSize}
          />
        </>
      )}
    </div>
  );
};
