
import React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, Users, Tag } from "lucide-react";

interface CalendarFiltersProps {
  availableSdrs: { id: string; name: string }[];
  availableMissionTypes: string[];
  selectedSdrIds: string[];
  selectedMissionTypes: string[];
  onSdrSelectionChange: (sdrIds: string[]) => void;
  onMissionTypeChange: (types: string[]) => void;
  isAdmin: boolean;
}

export const CalendarFilters: React.FC<CalendarFiltersProps> = ({
  availableSdrs,
  availableMissionTypes,
  selectedSdrIds,
  selectedMissionTypes,
  onSdrSelectionChange,
  onMissionTypeChange,
  isAdmin
}) => {
  const handleSdrToggle = (sdrId: string) => {
    if (selectedSdrIds.includes(sdrId)) {
      onSdrSelectionChange(selectedSdrIds.filter(id => id !== sdrId));
    } else {
      onSdrSelectionChange([...selectedSdrIds, sdrId]);
    }
  };

  const handleMissionTypeToggle = (type: string) => {
    if (selectedMissionTypes.includes(type)) {
      onMissionTypeChange(selectedMissionTypes.filter(t => t !== type));
    } else {
      onMissionTypeChange([...selectedMissionTypes, type]);
    }
  };

  const clearAllFilters = () => {
    onSdrSelectionChange([]);
    onMissionTypeChange([]);
  };

  const hasActiveFilters = selectedSdrIds.length > 0 || selectedMissionTypes.length > 0;

  return (
    <div className="flex items-center gap-2">
      {/* Filtre par SDR (Admin uniquement) */}
      {isAdmin && availableSdrs.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Users className="h-4 w-4 mr-2" />
              SDRs
              {selectedSdrIds.length > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {selectedSdrIds.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Filtrer par SDR</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableSdrs.map(sdr => (
                  <div key={sdr.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`sdr-${sdr.id}`}
                      checked={selectedSdrIds.includes(sdr.id)}
                      onCheckedChange={() => handleSdrToggle(sdr.id)}
                    />
                    <label
                      htmlFor={`sdr-${sdr.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {sdr.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Filtre par type de mission */}
      {availableMissionTypes.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Tag className="h-4 w-4 mr-2" />
              Types
              {selectedMissionTypes.length > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {selectedMissionTypes.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48" align="end">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Filtrer par type</h4>
              <div className="space-y-2">
                {availableMissionTypes.map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={selectedMissionTypes.includes(type)}
                      onCheckedChange={() => handleMissionTypeToggle(type)}
                    />
                    <label
                      htmlFor={`type-${type}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Bouton pour effacer tous les filtres */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-8 text-muted-foreground">
          Effacer les filtres
        </Button>
      )}
    </div>
  );
};
