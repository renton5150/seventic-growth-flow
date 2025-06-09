
import React from "react";
import { useWorkScheduleNew } from "@/hooks/useWorkScheduleNew";
import { WorkScheduleHeader } from "./WorkScheduleHeader";
import { WorkScheduleCalendarNew } from "./WorkScheduleCalendarNew";
import { WorkScheduleFilters } from "./WorkScheduleFilters";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export const WorkScheduleView = () => {
  const { user } = useAuth();
  
  const {
    calendarData,
    monthLabel,
    teleworkDates,
    isLoading,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    addTelework,
    removeTelework,
    resetTelework,
    canAddTelework,
    isAdding,
    isRemoving,
    isResetting,
    isAdmin,
    userId
  } = useWorkScheduleNew();

  const handleDayClick = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const hasTelework = teleworkDates.includes(dateString);
    
    console.log("🎯 [WorkScheduleView] Clic sur:", dateString, "hasTelework:", hasTelework);
    
    if (hasTelework) {
      // Supprimer directement - la confirmation est déjà gérée dans le calendrier
      console.log("🗑️ [WorkScheduleView] Suppression télétravail");
      removeTelework(date);
    } else {
      // Vérifier la limite avant d'ajouter
      if (!canAddTelework(date)) {
        console.log("⚠️ [WorkScheduleView] Limite de 2 jours par semaine atteinte");
        return;
      }
      
      console.log("➕ [WorkScheduleView] Ajout télétravail");
      addTelework(date);
    }
  };

  const handleReset = () => {
    if (!window.confirm("Êtes-vous sûr de vouloir réinitialiser complètement votre calendrier de télétravail ? Cette action supprimera tous vos jours de télétravail.")) {
      return;
    }
    
    console.log("🔄 [WorkScheduleView] Réinitialisation du calendrier");
    resetTelework();
  };

  const isProcessing = isAdding || isRemoving || isResetting;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Chargement du planning de télétravail...</div>
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
          onCreateRequest={() => {}} // Plus utilisé
          canCreateRequest={false} // Désactivé
        />
        
        {/* Boutons d'action */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isProcessing}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {isResetting ? "Réinitialisation..." : "Réinitialiser"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filtres */}
        <div className="lg:col-span-1">
          <WorkScheduleFilters
            isAdmin={isAdmin}
            availableUsers={[]}
            selectedUserId={userId}
            selectedRequestTypes={['telework']}
            selectedStatuses={['approved']}
            onUserChange={() => {}}
            onRequestTypesChange={() => {}}
            onStatusesChange={() => {}}
          />
        </div>

        {/* Calendrier */}
        <div className="lg:col-span-3">
          <WorkScheduleCalendarNew
            calendarData={calendarData}
            onDayClick={handleDayClick}
            canAddTelework={canAddTelework}
            isProcessing={isProcessing}
          />
        </div>
      </div>

      {/* Informations et légende */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-medium mb-3">Planning Télétravail - Nouveau Système</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Statistiques */}
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">Statistiques</h4>
            <div className="space-y-1 text-sm">
              <div>Jours de télétravail programmés: <span className="font-medium">{teleworkDates.length}</span></div>
              <div className="text-green-600">✅ Nouveau système avec contraintes strictes</div>
              <div className="text-blue-600">🔒 Protection contre les doublons</div>
              <div className="text-purple-600">🗑️ Suppression fiable avec bouton dédié</div>
            </div>
          </div>
          
          {/* Légende */}
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">Instructions</h4>
            <div className="space-y-1 text-sm">
              <div>• Cliquez sur un jour libre pour ajouter du télétravail</div>
              <div>• Cliquez sur le bouton ✕ rouge pour supprimer</div>
              <div>• Maximum 2 jours de télétravail par semaine</div>
            </div>
            <div className="flex flex-wrap gap-4 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
                <span className="text-sm">Télétravail</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <span className="text-sm">Weekend</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions de débogage */}
        {isProcessing && (
          <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
            ⏳ Traitement en cours... Veuillez patienter.
          </div>
        )}
      </div>
    </div>
  );
};
