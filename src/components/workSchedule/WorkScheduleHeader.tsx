
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Plus } from "lucide-react";

interface WorkScheduleHeaderProps {
  monthLabel: string;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onCreateRequest: () => void;
  canCreateRequest: boolean;
}

export const WorkScheduleHeader: React.FC<WorkScheduleHeaderProps> = ({
  monthLabel,
  onPreviousMonth,
  onNextMonth,
  onToday,
  onCreateRequest,
  canCreateRequest
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Planning Télétravail</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-lg font-medium min-w-[200px] text-center">
            {monthLabel}
          </div>
          <Button variant="outline" size="sm" onClick={onNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={onToday}>
          <Calendar className="h-4 w-4 mr-2" />
          Aujourd'hui
        </Button>
      </div>

      {canCreateRequest && (
        <Button onClick={onCreateRequest} className="bg-seventic-500 hover:bg-seventic-600">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle demande
        </Button>
      )}
    </div>
  );
};
