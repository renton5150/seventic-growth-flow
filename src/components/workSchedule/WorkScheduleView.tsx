
import React, { useState } from "react";
import { useWorkSchedule } from "@/hooks/useWorkSchedule";
import { WorkScheduleHeader } from "./WorkScheduleHeader";
import { WorkScheduleCalendar } from "./WorkScheduleCalendar";
import { WorkScheduleFilters } from "./WorkScheduleFilters";
import { WorkScheduleRequestDialog } from "./WorkScheduleRequestDialog";
import { QuickTeleworkSelector } from "./QuickTeleworkSelector";
import { WorkScheduleRequest } from "@/types/workSchedule";
import { useAuth } from "@/contexts/AuthContext";
import { startOfWeek, format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

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
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

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

  // Nouvelle fonction pour ajout direct de télétravail
  const handleDirectTeleworkAdd = async (date: Date) => {
    if (!user?.id) return;

    try {
      const requestData = {
        user_id: user.id,
        request_type: 'telework' as const,
        start_date: format(date, 'yyyy-MM-dd'),
        end_date: format(date, 'yyyy-MM-dd'),
        status: 'approved' as const,
        is_exceptional: false,
        reason: 'Télétravail ajouté directement via planning',
        approved_by: user.id,
        approved_at: new Date().toISOString()
      };

      console.log("[WorkScheduleView] Ajout direct télétravail:", requestData);
      createRequest(requestData);
      toast.success("Jour de télétravail ajouté au planning");
    } catch (error) {
      console.error("[WorkScheduleView] Erreur ajout télétravail:", error);
      toast.error("Erreur lors de l'ajout du télétravail");
    }
  };

  const handleQuickTeleworkSelect = async (dates: Date[]) => {
    if (dates.length === 0) return;

    console.log("[WorkScheduleView] Création de demandes de télétravail pour:", dates);
    console.log("[WorkScheduleView] User ID:", user?.id);

    try {
      // Créer une demande approuvée directement pour chaque jour sélectionné
      for (const date of dates) {
        const requestData = {
          user_id: user!.id,
          request_type: 'telework' as const,
          start_date: format(date, 'yyyy-MM-dd'),
          end_date: format(date, 'yyyy-MM-dd'),
          status: 'approved' as const,
          is_exceptional: false,
          reason: `Télétravail sélectionné via planning rapide`,
          approved_by: user!.id,
          approved_at: new Date().toISOString()
        };

        console.log("[WorkScheduleView] Création de la demande:", requestData);
        
        await new Promise((resolve) => {
          createRequest(requestData);
          setTimeout(resolve, 100); // Petit délai entre les créations
        });
      }

      toast.success(`${dates.length} jour${dates.length > 1 ? 's' : ''} de télétravail ajouté${dates.length > 1 ? 's' : ''} au planning`);
    } catch (error) {
      console.error("[WorkScheduleView] Erreur lors de la création des demandes:", error);
      toast.error("Erreur lors de la création des demandes de télétravail");
    }
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
  const canUseQuickSelector = user?.role === 'sdr' || user?.role === 'growth';

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

      {/* Sélection rapide pour SDR et Growth */}
      {canUseQuickSelector && (
        <QuickTeleworkSelector
          onSelect={handleQuickTeleworkSelect}
          existingRequests={allRequests}
          currentWeek={currentWeek}
          onWeekChange={setCurrentWeek}
        />
      )}

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
            isAdmin={isAdmin}
            userId={user?.id || ''}
            onDirectTeleworkAdd={handleDirectTeleworkAdd}
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
        <div className="mt-2 text-sm text-gray-600">
          💡 <strong>Astuce :</strong> Cliquez directement sur une date pour ajouter du télétravail
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
