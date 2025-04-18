
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "./DateRangePicker";

export const PlanningHeader = () => {
  const [view, setView] = useState("month");

  const handleViewChange = (newView: string) => {
    setView(newView);
    
    // Déclencher un événement personnalisé pour communiquer avec PlanningGrid
    const event = new CustomEvent('planningViewChange', { 
      detail: { view: newView } 
    });
    document.dispatchEvent(event);
  };

  return (
    <div className="flex items-center justify-between pb-4 border-b">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Planning</h2>
        <p className="text-muted-foreground">
          Vue d'ensemble des missions
        </p>
      </div>
      <div className="flex items-center gap-4">
        <DateRangePicker />
        <Select value={view} onValueChange={handleViewChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sélectionner la vue" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Vue mensuelle</SelectItem>
            <SelectItem value="quarter">Vue trimestrielle</SelectItem>
            <SelectItem value="year">Vue annuelle</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
