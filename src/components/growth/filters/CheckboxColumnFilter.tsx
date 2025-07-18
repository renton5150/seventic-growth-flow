
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

interface CheckboxColumnFilterProps {
  values: string[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
}

export function CheckboxColumnFilter({
  values,
  selectedValues,
  onSelectionChange,
}: CheckboxColumnFilterProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(selectedValues);

  useEffect(() => {
    setSelected(selectedValues);
  }, [selectedValues]);

  useEffect(() => {
    console.log(`CheckboxColumnFilter - values:`, values);
  }, [values]);

  const handleCheckboxChange = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter(v => v !== value)
      : [...selected, value];
    
    console.log(`CheckboxColumnFilter - Changing selection:`, {
      value,
      currentSelected: selected,
      newSelected
    });
    
    setSelected(newSelected);
  };

  const handleApplyFilter = () => {
    console.log(`CheckboxColumnFilter - Applying filter:`, selected);
    onSelectionChange(selected);
    setOpen(false);
  };

  const handleClearFilter = () => {
    console.log(`CheckboxColumnFilter - Clearing filter`);
    setSelected([]);
    onSelectionChange([]);
    setOpen(false);
  };

  const hasFilter = selectedValues.length > 0;
  const uniqueOptions = [...new Set(values)].sort();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant={hasFilter ? "default" : "ghost"} 
          size="icon"
          className={hasFilter ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
        >
          <Filter className="h-4 w-4" />
          <span className="sr-only">Filtre</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filtrer</h4>
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
              {uniqueOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`filter-${option}`}
                    checked={selected.includes(option)}
                    onCheckedChange={() => handleCheckboxChange(option)}
                  />
                  <Label htmlFor={`filter-${option}`}>{option || "Non assigné"}</Label>
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
