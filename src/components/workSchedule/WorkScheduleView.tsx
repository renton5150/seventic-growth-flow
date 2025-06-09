
import React, { useState } from "react";
import { useWorkSchedule } from "@/hooks/useWorkSchedule";
import { WorkScheduleHeader } from "./WorkScheduleHeader";
import { WorkScheduleCalendar } from "./WorkScheduleCalendar";
import { WorkScheduleFilters } from "./WorkScheduleFilters";
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
    isAdmin,
    isCreating,
    isDeleting
  } = useWorkSchedule();

  const handleRequestClick = (request: WorkScheduleRequest) => {
    // Simple suppression du télétravail avec confirmation
    console.log("[WorkScheduleView] Clic sur demande de suppression:", request.id, "date:", request.start_date);
    
    if (window.confirm("Supprimer ce jour de télétravail ?")) {
      console.log("[WorkScheduleView] Confirmation de suppression pour:", request.id);
      deleteRequest(request.id);
    } else {
      console.log("[WorkScheduleView] Suppression annulée par l'utilisateur");
    }
  };

  // Ajout direct de télétravail avec vérification renforcée
  const handleDirectTeleworkAdd = async (date: Date) => {
    if (!user?.id) {
      toast.error("Utilisateur non connecté");
      return;
    }

    if (isCreating || isDeleting) {
      console.log("[WorkScheduleView] Opération en cours, ignorer");
      return;
    }

    try {
      const dateString = format(date, 'yyyy-MM-dd');
      console.log("[WorkScheduleView] Ajout télétravail pour la date:", dateString);
      
      // Vérifier si une demande existe déjà dans l'état local
      const existingRequest = allRequests.find(req => 
        req.start_date === dateString && 
        req.user_id === user.id &&
        req.request_type === 'telework'
      );
      
      if (existingRequest) {
        console.log("[WorkScheduleView] Demande existante trouvée dans l'état local:", existingRequest.id);
        toast.error("Une demande de télétravail existe déjà pour cette date");
        return;
      }

      const requestData = {
        user_id: user.id,
        request_type: 'telework' as const,
        start_date: dateString,
        end_date: dateString,
        status: 'approved' as const,
        is_exceptional: false,
        reason: 'Télétravail sélectionné',
        approved_by: user.id,
        approved_at: new Date().toISOString()
      };

      console.log("[WorkScheduleView] Création demande télétravail:", requestData);
      createRequest(requestData);
      
    } catch (error) {
      console.error("[WorkScheduleView] Erreur critique:", error);
      toast.error("Erreur critique lors de l'ajout du télétravail");
    }
  };

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
            <div className="w-4 h-4 bg-blue-600 rounded"></div>
            <span className="text-sm">Télétravail</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <span className="text-sm">Weekend</span>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          💡 <strong>Règle :</strong> Maximum 2 jours de télétravail par semaine. Cliquez sur une date pour sélectionner/désélectionner.
        </div>
      </div>
    </div>
  );
};
