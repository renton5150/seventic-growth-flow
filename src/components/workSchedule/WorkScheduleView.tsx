
import React, { useState } from "react";
import { useWorkSchedule } from "@/hooks/useWorkSchedule";
import { WorkScheduleHeader } from "./WorkScheduleHeader";
import { WorkScheduleCalendar } from "./WorkScheduleCalendar";
import { WorkScheduleFilters } from "./WorkScheduleFilters";
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

  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const handleRequestClick = (request: WorkScheduleRequest) => {
    // Simple suppression du télétravail
    if (window.confirm("Supprimer ce jour de télétravail ?")) {
      deleteRequest(request.id);
    }
  };

  // Ajout direct de télétravail
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
        reason: 'Télétravail sélectionné',
        approved_by: user.id,
        approved_at: new Date().toISOString()
      };

      console.log("[WorkScheduleView] Ajout télétravail:", requestData);
      createRequest(requestData);
      toast.success("Jour de télétravail ajouté");
    } catch (error) {
      console.error("[WorkScheduleView] Erreur:", error);
      toast.error("Erreur lors de l'ajout du télétravail");
    }
  };

  const handleQuickTeleworkSelect = async (dates: Date[]) => {
    if (dates.length === 0) return;

    try {
      for (const date of dates) {
        const requestData = {
          user_id: user!.id,
          request_type: 'telework' as const,
          start_date: format(date, 'yyyy-MM-dd'),
          end_date: format(date, 'yyyy-MM-dd'),
          status: 'approved' as const,
          is_exceptional: false,
          reason: 'Télétravail sélectionné via planning rapide',
          approved_by: user!.id,
          approved_at: new Date().toISOString()
        };

        await new Promise((resolve) => {
          createRequest(requestData);
          setTimeout(resolve, 100);
        });
      }

      toast.success(`${dates.length} jour${dates.length > 1 ? 's' : ''} de télétravail ajouté${dates.length > 1 ? 's' : ''}`);
    } catch (error) {
      console.error("[WorkScheduleView] Erreur:", error);
      toast.error("Erreur lors de la création des demandes de télétravail");
    }
  };

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
        onCreateRequest={() => {}} // Plus de création manuelle
        canCreateRequest={false} // Désactivé
      />

      {/* Sélection rapide */}
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
            onDayClick={() => {}} // Plus utilisé
            onRequestClick={handleRequestClick}
            isAdmin={isAdmin}
            userId={user?.id || ''}
            onDirectTeleworkAdd={handleDirectTeleworkAdd}
          />
        </div>
      </div>

      {/* Légende simplifiée */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-medium mb-3">Légende</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm">Télétravail (TT)</span>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          💡 <strong>Règle :</strong> Maximum 2 jours de télétravail par semaine. Cliquez sur une date pour sélectionner/désélectionner.
        </div>
      </div>
    </div>
  );
};
