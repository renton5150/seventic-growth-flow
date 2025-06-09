
import React, { useState } from "react";
import { format, addDays, startOfWeek, isSameDay, isWeekend } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface QuickTeleworkSelectorProps {
  onSelect: (dates: Date[]) => void;
  existingRequests: any[];
  currentWeek: Date;
  onWeekChange: (date: Date) => void;
}

export const QuickTeleworkSelector: React.FC<QuickTeleworkSelectorProps> = ({
  onSelect,
  existingRequests,
  currentWeek,
  onWeekChange
}) => {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  const getWeekDays = (startDate: Date) => {
    const start = startOfWeek(startDate, { weekStartsOn: 1 });
    return Array.from({ length: 5 }, (_, i) => addDays(start, i));
  };

  const weekDays = getWeekDays(currentWeek);

  const isDaySelected = (date: Date) => {
    return selectedDates.some(selectedDate => isSameDay(selectedDate, date));
  };

  const isDayUnavailable = (date: Date) => {
    return existingRequests.some(request => {
      const startDate = new Date(request.start_date);
      const endDate = new Date(request.end_date);
      return date >= startDate && date <= endDate && request.status !== 'rejected';
    });
  };

  const handleDayClick = (date: Date) => {
    if (isDayUnavailable(date) || isWeekend(date)) return;

    setSelectedDates(prev => {
      const isSelected = prev.some(selectedDate => isSameDay(selectedDate, date));
      
      if (isSelected) {
        return prev.filter(selectedDate => !isSameDay(selectedDate, date));
      } else {
        // Vérifier la limite de 2 jours par semaine
        const sameWeekDays = prev.filter(selectedDate => {
          const selectedWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
          const currentWeekStart = startOfWeek(date, { weekStartsOn: 1 });
          return isSameDay(selectedWeekStart, currentWeekStart);
        });

        if (sameWeekDays.length >= 2) {
          return prev; // Ne pas ajouter si limite atteinte
        }

        return [...prev, date];
      }
    });
  };

  const handleConfirm = () => {
    if (selectedDates.length > 0) {
      onSelect(selectedDates);
      setSelectedDates([]);
    }
  };

  const handleClear = () => {
    setSelectedDates([]);
  };

  const goToPreviousWeek = () => {
    onWeekChange(addDays(currentWeek, -7));
  };

  const goToNextWeek = () => {
    onWeekChange(addDays(currentWeek, 7));
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Sélection télétravail</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
              ←
            </Button>
            <span className="text-sm font-normal px-3 py-1">
              {format(weekDays[0], 'dd MMM', { locale: fr })} - {format(weekDays[4], 'dd MMM yyyy', { locale: fr })}
            </span>
            <Button variant="outline" size="sm" onClick={goToNextWeek}>
              →
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-3 mb-4">
          {weekDays.map((day, index) => {
            const isSelected = isDaySelected(day);
            const isUnavailable = isDayUnavailable(day);
            const dayName = format(day, 'EEEE', { locale: fr });
            
            return (
              <div
                key={index}
                className={cn(
                  "p-3 text-center rounded-lg border-2 cursor-pointer transition-all",
                  isSelected && "border-blue-500 bg-blue-50",
                  !isSelected && !isUnavailable && "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                  isUnavailable && "border-red-200 bg-red-50 cursor-not-allowed opacity-50"
                )}
                onClick={() => handleDayClick(day)}
              >
                <div className="text-xs text-gray-600 capitalize mb-1">
                  {dayName.substring(0, 3)}
                </div>
                <div className="text-lg font-semibold">
                  {format(day, 'd')}
                </div>
                <div className="text-xs mt-1">
                  {isSelected && <Check className="h-3 w-3 text-blue-600 mx-auto" />}
                  {isUnavailable && <X className="h-3 w-3 text-red-600 mx-auto" />}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-xs text-gray-600 mb-3">
          • Maximum 2 jours de télétravail par semaine
          • {selectedDates.length}/2 jours sélectionnés cette semaine
          • Les jours sélectionnés seront directement inscrits dans le planning
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleConfirm}
            disabled={selectedDates.length === 0}
            className="flex-1"
          >
            Valider ({selectedDates.length} jour{selectedDates.length > 1 ? 's' : ''})
          </Button>
          <Button 
            variant="outline" 
            onClick={handleClear}
            disabled={selectedDates.length === 0}
          >
            Effacer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
