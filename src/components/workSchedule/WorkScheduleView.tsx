
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
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { workScheduleService } from "@/services/workScheduleService";

export const WorkScheduleView = () => {
  const { user } = useAuth();
  const [isResetting, setIsResetting] = useState(false);
  
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
    isDeleting,
    calendarKey,
    forceCalendarRefresh,
    refetch
  } = useWorkSchedule();

  const handleRequestClick = (request: WorkScheduleRequest) => {
    // Simple suppression du télétravail avec confirmation
    console.log("🔥 [WorkScheduleView] Clic sur demande de suppression:", request.id, "date:", request.start_date);
    
    if (window.confirm("Supprimer ce jour de télétravail ?")) {
      console.log("🔥 [WorkScheduleView] Confirmation de suppression pour:", request.id);
      deleteRequest(request.id);
    } else {
      console.log("[WorkScheduleView] Suppression annulée par l'utilisateur");
    }
  };

  // Fonction de réinitialisation du calendrier pour éliminer les données fantômes
  const handleResetCalendar = async () => {
    if (!user?.id) {
      toast.error("Utilisateur non connecté");
      return;
    }

    if (!window.confirm("Êtes-vous sûr de vouloir réinitialiser le calendrier de télétravail ? Cette action nettoiera toutes les données incohérentes.")) {
      return;
    }

    try {
      setIsResetting(true);
      console.log("🧹 [WorkScheduleView] Début de la réinitialisation du calendrier");
      
      // Appel au service de nettoyage
      const cleanDates = await workScheduleService.cleanupWorkScheduleData(user.id);
      console.log("🧹 [WorkScheduleView] Données nettoyées:", cleanDates);
      
      // Force refresh complet du calendrier
      forceCalendarRefresh();
      
      // Invalidation et refetch forcé
      await refetch();
      
      toast.success("Calendrier de télétravail réinitialisé avec succès");
    } catch (error) {
      console.error("❌ [WorkScheduleView] Erreur lors de la réinitialisation:", error);
      toast.error("Erreur lors de la réinitialisation du calendrier: " + (error as Error).message);
    } finally {
      setIsResetting(false);
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
      console.log("✅ [WorkScheduleView] Ajout télétravail pour la date:", dateString);
      
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

      console.log("✅ [WorkScheduleView] Création demande télétravail:", requestData);
      createRequest(requestData);
      
    } catch (error) {
      console.error("❌ [WorkScheduleView] Erreur critique:", error);
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
      <div className="flex justify-between items-center">
        <WorkScheduleHeader
          monthLabel={monthLabel}
          onPreviousMonth={goToPreviousMonth}
          onNextMonth={goToNextMonth}
          onToday={goToToday}
          onCreateRequest={() => {}} // Plus de création manuelle
          canCreateRequest={false} // Désactivé
        />
        
        {/* Bouton de réinitialisation pour éliminer les données fantômes */}
        <Button
          variant="outline"
          onClick={handleResetCalendar}
          disabled={isResetting}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          {isResetting ? "Réinitialisation..." : "Réinitialiser calendrier"}
        </Button>
      </div>

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
            calendarKey={calendarKey} // Passage de la clé pour forcer le rafraîchissement
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
        <div className="mt-2 text-sm text-orange-600">
          🔧 <strong>Problème de données fantômes ?</strong> Utilisez le bouton "Réinitialiser calendrier" pour nettoyer les données incohérentes.
        </div>
      </div>
    </div>
  );
};
