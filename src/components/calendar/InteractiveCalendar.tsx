
import React from "react";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Plus } from "lucide-react";
import { useInteractiveCalendar } from "@/hooks/useInteractiveCalendar";
import { DraggableMission } from "./DraggableMission";
import { DroppableDay } from "./DroppableDay";
import { MissionEditDialog } from "./MissionEditDialog";
import { CalendarFilters } from "./CalendarFilters";
import { Skeleton } from "@/components/ui/skeleton";

export const InteractiveCalendar = () => {
  const {
    calendarData,
    selectedDate,
    selectedMission,
    isEditDialogOpen,
    isLoading,
    monthLabel,
    draggedMission,
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
    handleDragStart,
    handleDragEnd,
    handleMissionClick,
    handleCreateMission,
    setIsEditDialogOpen,
    setSelectedMission,
    getMissionColor,
    refetch,
    // Permissions
    isAdmin
  } = useInteractiveCalendar();

  const handleDragStartEvent = (event: DragStartEvent) => {
    const { active } = event;
    const missionData = active.data.current as { mission: any; sourceDate: Date };
    if (missionData) {
      handleDragStart(missionData.mission, missionData.sourceDate);
    }
  };

  const handleDragEndEvent = (event: DragEndEvent) => {
    const { over } = event;
    if (over?.data.current?.date) {
      handleDragEnd(over.data.current.date);
    } else {
      handleDragEnd(null);
    }
  };

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

  return (
    <DndContext onDragStart={handleDragStartEvent} onDragEnd={handleDragEndEvent}>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-2xl font-bold capitalize">
              <Calendar className="h-6 w-6" />
              {monthLabel}
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* En-têtes des jours */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((day) => (
              <div
                key={day}
                className="h-10 flex items-center justify-center font-semibold text-sm text-muted-foreground bg-muted rounded-md"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grille du calendrier */}
          <div className="grid grid-cols-7 gap-1">
            {calendarData.weeks.map((week, weekIndex) =>
              week.days.map((day, dayIndex) => (
                <DroppableDay
                  key={`${weekIndex}-${dayIndex}`}
                  day={day}
                  onCreateMission={handleCreateMission}
                  onMissionClick={handleMissionClick}
                  onDragStart={handleDragStart}
                  getMissionColor={getMissionColor}
                />
              ))
            )}
          </div>

          {/* Légende */}
          <div className="mt-6 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Mission Full</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span>Mission Part</span>
            </div>
            <div className="flex items-center gap-2">
              <Plus className="w-3 h-3 text-muted-foreground" />
              <span>Cliquer sur un jour pour ajouter une mission</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overlay de drag */}
      <DragOverlay>
        {draggedMission ? (
          <div className="bg-white border border-gray-300 rounded p-2 shadow-lg cursor-grabbing">
            <div className="text-xs font-medium truncate">
              {draggedMission.mission.name}
            </div>
            <div className="text-xs text-muted-foreground">
              {draggedMission.mission.client}
            </div>
          </div>
        ) : null}
      </DragOverlay>

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
    </DndContext>
  );
};
