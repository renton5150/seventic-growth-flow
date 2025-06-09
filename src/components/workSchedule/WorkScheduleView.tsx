
import React, { useState } from "react";
import { useWorkSchedule } from "@/hooks/useWorkSchedule";
import { WorkScheduleHeader } from "./WorkScheduleHeader";
import { WorkScheduleCalendar } from "./WorkScheduleCalendar";
import { WorkScheduleFilters } from "./WorkScheduleFilters";
import { WorkScheduleRequestDialog } from "./WorkScheduleRequestDialog";
import { WorkScheduleRequest } from "@/types/workSchedule";
import { useAuth } from "@/contexts/AuthContext";

export const WorkScheduleView = () => {
  const { user } = useAuth();
  const {
    calendarData,
    monthLabel,
    allRequests,
    availableUsers,
    isLoading,
    selectedUserId,
    selectedRequestTypes,
    selectedStatuses,
    setSelectedUserId,
    setSelectedRequestTypes,
    setSelectedStatuses,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    createRequest,
    updateRequest,
    deleteRequest,
    isAdmin
  } = useWorkSchedule();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<WorkScheduleRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedRequest(null);
    setIsDialogOpen(true);
  };

  const handleRequestClick = (request: WorkScheduleRequest) => {
    setSelectedRequest(request);
    setSelectedDate(null);
    setIsDialogOpen(true);
  };

  const handleCreateRequest = () => {
    setSelectedDate(new Date());
    setSelectedRequest(null);
    setIsDialogOpen(true);
  };

  const handleSubmitRequest = (requestData: Omit<WorkScheduleRequest, 'id' | 'created_at' | 'updated_at'>) => {
    if (selectedRequest) {
      updateRequest({ 
        id: selectedRequest.id, 
        updates: requestData 
      });
    } else {
      createRequest(requestData);
    }
  };

  const canCreateRequest = user?.role === 'sdr' || user?.role === 'growth' || isAdmin;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Chargement du planning...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WorkScheduleHeader
        monthLabel={monthLabel}
        onPreviousMonth={goToPreviousMonth}
        onNextMonth={goToNextMonth}
        onToday={goToToday}
        onCreateRequest={handleCreateRequest}
        canCreateRequest={canCreateRequest}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filtres */}
        <div className="lg:col-span-1">
          <WorkScheduleFilters
            isAdmin={isAdmin}
            availableUsers={availableUsers}
            selectedUserId={selectedUserId}
            selectedRequestTypes={selectedRequestTypes}
            selectedStatuses={selectedStatuses}
            onUserChange={setSelectedUserId}
            onRequestTypesChange={setSelectedRequestTypes}
            onStatusesChange={setSelectedStatuses}
          />
        </div>

        {/* Calendrier */}
        <div className="lg:col-span-3">
          <WorkScheduleCalendar
            calendarData={calendarData}
            onDayClick={handleDayClick}
            onRequestClick={handleRequestClick}
          />
        </div>
      </div>

      {/* Légende */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-medium mb-3">Légende</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm">Télétravail (TT)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm">Congé payé (CP)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-sm">Congé sans solde (CSS)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-500 opacity-50 rounded border-2 border-dashed border-gray-400"></div>
            <span className="text-sm">En attente de validation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 opacity-30 rounded"></div>
            <span className="text-sm">Refusé</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">*</span>
            <span className="text-sm">Demande exceptionnelle</span>
          </div>
        </div>
      </div>

      {/* Dialog de création/modification */}
      <WorkScheduleRequestDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        request={selectedRequest}
        defaultDate={selectedDate}
        onSubmit={handleSubmitRequest}
        isAdmin={isAdmin}
        userId={user?.id || ''}
        existingRequests={allRequests}
      />
    </div>
  );
};
