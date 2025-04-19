
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "./DateRangePicker";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Filter } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Mission } from "@/types/types";

export interface PlanningFilters {
  view: string;
  sdrIds: string[];
  missionTypes: string[];
  dateRange?: { from: Date; to: Date };
}

interface PlanningHeaderProps {
  missions: Mission[];
  onFiltersChange: (filters: PlanningFilters) => void;
}

export const PlanningHeader = ({ missions, onFiltersChange }: PlanningHeaderProps) => {
  const [view, setView] = useState("resourceTimelineMonth");
  const [selectedSdrIds, setSelectedSdrIds] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined);

  // Extraire les SDRs uniques des missions
  const uniqueSdrs = Array.from(
    new Map(
      missions
        .filter(mission => mission.sdrId && mission.sdrName)
        .map(mission => [mission.sdrId, { id: mission.sdrId, name: mission.sdrName }])
    ).values()
  );

  // Extraire les types de missions uniques
  const uniqueTypes = Array.from(new Set(missions.map(mission => mission.type)));

  const handleViewChange = (newView: string) => {
    setView(newView);
    onFiltersChange({
      view: newView,
      sdrIds: selectedSdrIds,
      missionTypes: selectedTypes,
      dateRange
    });
  };

  const handleSdrChange = (sdrId: string) => {
    const newSelection = selectedSdrIds.includes(sdrId)
      ? selectedSdrIds.filter(id => id !== sdrId)
      : [...selectedSdrIds, sdrId];
    
    setSelectedSdrIds(newSelection);
    onFiltersChange({
      view,
      sdrIds: newSelection,
      missionTypes: selectedTypes,
      dateRange
    });
  };

  const handleTypeChange = (type: string) => {
    const newSelection = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    
    setSelectedTypes(newSelection);
    onFiltersChange({
      view,
      sdrIds: selectedSdrIds,
      missionTypes: newSelection,
      dateRange
    });
  };

  const handleDateRangeChange = (range?: { from: Date; to: Date }) => {
    setDateRange(range);
    onFiltersChange({
      view,
      sdrIds: selectedSdrIds,
      missionTypes: selectedTypes,
      dateRange: range
    });
  };

  return (
    <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between pb-4 border-b">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Planning</h2>
        <p className="text-muted-foreground">
          Vue d'ensemble des missions
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {/* Filtre par SDR */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center justify-between w-[200px]">
              {selectedSdrIds.length === 0 
                ? "Tous les SDRs" 
                : `${selectedSdrIds.length} SDR${selectedSdrIds.length > 1 ? 's' : ''}`}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="end">
            <div className="p-2">
              {uniqueSdrs.map(sdr => (
                <div key={sdr.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer">
                  <Checkbox 
                    id={`sdr-${sdr.id}`}
                    checked={selectedSdrIds.includes(sdr.id)}
                    onCheckedChange={() => handleSdrChange(sdr.id)}
                  />
                  <label htmlFor={`sdr-${sdr.id}`} className="text-sm font-medium leading-none cursor-pointer flex-grow">
                    {sdr.name}
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Filtre par type de mission */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center justify-between w-[200px]">
              {selectedTypes.length === 0 
                ? "Tous les types" 
                : `${selectedTypes.length} type${selectedTypes.length > 1 ? 's' : ''}`}
              <Filter className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="end">
            <div className="p-2">
              {uniqueTypes.map(type => (
                <div key={type} className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer">
                  <Checkbox 
                    id={`type-${type}`}
                    checked={selectedTypes.includes(type)}
                    onCheckedChange={() => handleTypeChange(type)}
                  />
                  <label htmlFor={`type-${type}`} className="text-sm font-medium leading-none cursor-pointer flex-grow">
                    {type}
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Sélecteur de plage de dates - Fixed the onChange prop to match expected type */}
        <DateRangePicker 
          onChange={(range) => handleDateRangeChange(range)} 
        />
        
        {/* Sélecteur de vue */}
        <Select value={view} onValueChange={handleViewChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sélectionner la vue" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="resourceTimelineDay">Vue journalière</SelectItem>
            <SelectItem value="resourceTimelineWeek">Vue hebdomadaire</SelectItem>
            <SelectItem value="resourceTimelineMonth">Vue mensuelle</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
