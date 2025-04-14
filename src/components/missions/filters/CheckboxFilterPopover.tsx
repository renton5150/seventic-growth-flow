
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Filter, X, Check } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CheckboxFilterPopoverProps {
  column: string;
  options: string[];
  selectedValues: string[];
  onFilterChange: (values: string[]) => void;
  hasFilter: boolean;
  onClearFilter: () => void;
}

export function CheckboxFilterPopover({
  column,
  options,
  selectedValues,
  onFilterChange,
  hasFilter,
  onClearFilter,
}: CheckboxFilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(selectedValues);

  useEffect(() => {
    setSelected(selectedValues);
  }, [selectedValues]);

  const handleCheckboxChange = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter(v => v !== value)
      : [...selected, value];
    setSelected(newSelected);
  };

  const handleApplyFilter = () => {
    onFilterChange(selected);
    setOpen(false);
  };

  const handleClearFilter = () => {
    setSelected([]);
    onClearFilter();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant={hasFilter ? "default" : "ghost"} 
          size="icon"
          className={hasFilter ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
        >
          <Filter className="h-4 w-4" />
          <span className="sr-only">Filtre {column}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filtrer par {column}</h4>
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
          
          <Separator />
          
          <ScrollArea className="h-[200px] pr-4">
            <div className="space-y-4">
              {options.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${column}-${option}`}
                    checked={selected.includes(option)}
                    onCheckedChange={() => handleCheckboxChange(option)}
                  />
                  <Label htmlFor={`${column}-${option}`}>{option || "Non assigné"}</Label>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-2">
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
