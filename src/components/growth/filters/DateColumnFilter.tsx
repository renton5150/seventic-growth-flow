
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Filter, X, Check } from "lucide-react";
import { Separator } from "@/components/ui/separator";

type DateFilterType = 'equals' | 'before' | 'after' | 'between' | null;

interface DateFilterValues {
  date?: Date | null;
  startDate?: Date | null;
  endDate?: Date | null;
}

interface DateColumnFilterProps {
  selectedFilter?: {
    type: DateFilterType;
    values: DateFilterValues;
  };
  onFilterChange: (type: DateFilterType, values: DateFilterValues) => void;
}

export function DateColumnFilter({
  selectedFilter,
  onFilterChange,
}: DateColumnFilterProps) {
  const [filterType, setFilterType] = useState<DateFilterType>(selectedFilter?.type || null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(selectedFilter?.values.date || null);
  const [startDate, setStartDate] = useState<Date | null>(selectedFilter?.values.startDate || null);
  const [endDate, setEndDate] = useState<Date | null>(selectedFilter?.values.endDate || null);
  const [open, setOpen] = useState(false);

  const handleFilterTypeChange = (value: string) => {
    setFilterType(value as DateFilterType);
  };

  const handleApplyFilter = () => {
    if (!filterType) {
      onFilterChange(null, {});
      setOpen(false);
      return;
    }

    const values: DateFilterValues = {};
    
    if (filterType === 'equals' || filterType === 'before' || filterType === 'after') {
      values.date = selectedDate;
    } else if (filterType === 'between') {
      values.startDate = startDate;
      values.endDate = endDate;
    }

    onFilterChange(filterType, values);
    setOpen(false);
  };

  const handleClearFilter = () => {
    setFilterType(null);
    setSelectedDate(null);
    setStartDate(null);
    setEndDate(null);
    onFilterChange(null, {});
    setOpen(false);
  };

  const hasFilter = selectedFilter && selectedFilter.type;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant={hasFilter ? "default" : "ghost"} 
          size="icon"
          className={hasFilter ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
        >
          <Filter className="h-4 w-4" />
          <span className="sr-only">Filtre de date</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 min-w-[300px]" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filtrer par date</h4>
            {hasFilter && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 text-xs"
                onClick={handleClearFilter}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Effacer
              </Button>
            )}
          </div>

          <RadioGroup 
            value={filterType || ""} 
            onValueChange={handleFilterTypeChange}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="equals" id="equals" />
              <Label htmlFor="equals">Est égal à</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="before" id="before" />
              <Label htmlFor="before">Est avant</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="after" id="after" />
              <Label htmlFor="after">Est après</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="between" id="between" />
              <Label htmlFor="between">Se trouve entre</Label>
            </div>
          </RadioGroup>

          <Separator />

          {(filterType === 'equals' || filterType === 'before' || filterType === 'after') && (
            <div className="space-y-2">
              <Label>Sélectionner une date</Label>
              <div className="border rounded-md p-1">
                <Calendar
                  mode="single"
                  selected={selectedDate || undefined}
                  onSelect={setSelectedDate}
                  locale={fr}
                  className="p-3 pointer-events-auto"
                />
              </div>
            </div>
          )}

          {filterType === 'between' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Date de début</Label>
                <div className="border rounded-md p-1">
                  <Calendar
                    mode="single"
                    selected={startDate || undefined}
                    onSelect={setStartDate}
                    locale={fr}
                    className="p-3 pointer-events-auto"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Date de fin</Label>
                <div className="border rounded-md p-1">
                  <Calendar
                    mode="single"
                    selected={endDate || undefined}
                    onSelect={setEndDate}
                    locale={fr}
                    className="p-3 pointer-events-auto"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button size="sm" onClick={handleApplyFilter}>
              <Check className="h-4 w-4 mr-1" />
              Appliquer
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
