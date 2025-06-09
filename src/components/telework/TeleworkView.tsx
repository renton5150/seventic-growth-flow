
import React, { useState } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { TeleworkCalendar } from "./TeleworkCalendar";
import { useTelework } from "@/hooks/useTelework";

export const TeleworkView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const {
    teleworkDays,
    isLoading,
    addTeleworkDay,
    removeTeleworkDay,
    isAdding,
    isRemoving
  } = useTelework();

  const isProcessing = isAdding || isRemoving;

  // Navigation
  const goToPreviousMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Gérer le clic sur un jour
  const handleDayClick = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const hasTelework = teleworkDays.includes(dateString);
    
    if (hasTelework) {
      removeTeleworkDay(date);
    } else {
      addTeleworkDay(date);
    }
  };

  const monthLabel = format(currentDate, 'MMMM yyyy', { locale: fr });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Planning Télétravail</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth} disabled={isProcessing}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-lg font-medium min-w-[200px] text-center">
              {monthLabel}
            </div>
            <Button variant="outline" size="sm" onClick={goToNextMonth} disabled={isProcessing}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={goToToday} disabled={isProcessing}>
            <Calendar className="h-4 w-4 mr-2" />
            Aujourd'hui
          </Button>
        </div>
      </div>

      {/* Calendrier */}
      <TeleworkCalendar
        currentDate={currentDate}
        teleworkDays={teleworkDays}
        onDayClick={handleDayClick}
        isProcessing={isProcessing}
      />

      {/* Informations */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-medium mb-3">Planning Télétravail</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">Statistiques</h4>
            <div className="space-y-1 text-sm">
              <div>Jours programmés: <span className="font-medium">{teleworkDays.length}</span></div>
              <div className="text-green-600">✅ Système simplifié et fiable</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">Instructions</h4>
            <div className="space-y-1 text-sm">
              <div>• Cliquez sur un jour libre pour ajouter du télétravail</div>
              <div>• Cliquez sur un jour en télétravail pour le supprimer</div>
              <div>• Maximum 2 jours par semaine</div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-4 h-4 bg-blue-600 rounded"></div>
              <span className="text-sm">Télétravail</span>
            </div>
          </div>
        </div>
        
        {isProcessing && (
          <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
            ⏳ Traitement en cours...
          </div>
        )}
      </div>
    </div>
  );
};
