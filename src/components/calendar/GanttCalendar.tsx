
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Plus } from "lucide-react";
import { useInteractiveCalendar } from "@/hooks/useInteractiveCalendar";
import { CalendarFilters } from "./CalendarFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { MissionEditDialog } from "./MissionEditDialog";
import { GanttRow } from "./GanttRow";
import { GanttHeader } from "./GanttHeader";

export const GanttCalendar = () => {
  const {
    selectedDate,
    selectedMission,
    isEditDialogOpen,
    isLoading,
    monthLabel,
    missions,
    // Filtres
    selectedSdrIds,
    selectedMissionTypes,
    availableSdrs,
    availableMissionTypes,
    setSelectedSdrIds,
    setSelectedMissionTypes,
    // Actions
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    handleMissionClick,
    handleCreateMission,
    setIsEditDialogOpen,
    setSelectedMission,
    refetch,
    // Permissions
    isAdmin
  } = useInteractiveCalendar();

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Organiser les missions par SDR
  const missionsBySdr = missions.reduce((acc, mission) => {
    const sdrId = mission.sdrId || 'unassigned';
    const sdrName = mission.sdrName || 'Non assigné';
    
    if (!acc[sdrId]) {
      acc[sdrId] = {
        sdrId,
        sdrName,
        missions: []
      };
    }
    acc[sdrId].missions.push(mission);
    return acc;
  }, {} as Record<string, { sdrId: string; sdrName: string; missions: any[] }>);

  const sdrRows = Object.values(missionsBySdr);

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-2xl font-bold capitalize">
              <Calendar className="h-6 w-6" />
              Planning Gantt - {monthLabel}
            </CardTitle>
            <div className="flex items-center gap-4">
              {/* Filtres pour les admins */}
              <CalendarFilters
                availableSdrs={availableSdrs}
                availableMissionTypes={availableMissionTypes}
                selectedSdrIds={selectedSdrIds}
                selectedMissionTypes={selectedMissionTypes}
                onSdrSelectionChange={setSelectedSdrIds}
                onMissionTypeChange={setSelectedMissionTypes}
                isAdmin={isAdmin}
              />
              
              {/* Navigation du calendrier */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousMonth}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="px-3"
                >
                  Aujourd'hui
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextMonth}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <Button
                onClick={() => handleCreateMission(new Date())}
                className="bg-seventic-500 hover:bg-seventic-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Mission
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border rounded-lg overflow-hidden">
            <GanttHeader />
            <div className="max-h-[600px] overflow-y-auto">
              {sdrRows.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Aucune mission trouvée
                </div>
              ) : (
                sdrRows.map((sdrRow) => (
                  <GanttRow
                    key={sdrRow.sdrId}
                    sdrName={sdrRow.sdrName}
                    missions={sdrRow.missions}
                    onMissionClick={handleMissionClick}
                  />
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog d'édition */}
      <MissionEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedMission(null);
        }}
        mission={selectedMission}
        selectedDate={selectedDate}
        onSave={refetch}
      />
    </div>
  );
};
