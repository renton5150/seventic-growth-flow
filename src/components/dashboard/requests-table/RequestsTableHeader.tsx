
import { useState } from "react";
import {
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowDown,
  ArrowUp,
  Filter,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkflowStatus } from "@/types/types";

interface RequestsTableHeaderProps {
  missionView?: boolean;
  handleSort: (column: string) => void;
  showSdr?: boolean;
  isSDR?: boolean;
  sortColumn: string;
  sortDirection: "asc" | "desc";
  filters: {[key: string]: string[]};
  dateFilters: {[key: string]: any};
  onFilterChange: (column: string, values: string[]) => void;
  onDateFilterChange: (field: string, type: string, values: any) => void;
  uniqueValues: {[key: string]: string[]};
}

export const RequestsTableHeader = ({
  missionView = false,
  handleSort,
  showSdr = false,
  isSDR = false,
  sortColumn,
  sortDirection,
  filters,
  dateFilters,
  onFilterChange,
  onDateFilterChange,
  uniqueValues
}: RequestsTableHeaderProps) => {
  const [openFilters, setOpenFilters] = useState<{[key: string]: boolean}>({});
  const [dateFilterType, setDateFilterType] = useState<{[key: string]: string}>({});
  const [selectedDate, setSelectedDate] = useState<{[key: string]: Date | undefined}>({});

  // Log pour le débogage des valeurs uniques disponibles
  console.log("RequestsTableHeader - uniqueValues disponibles:", uniqueValues);

  const toggleFilter = (column: string) => {
    setOpenFilters(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const isFilterOpen = (column: string) => openFilters[column] || false;

  const handleCheckboxChange = (column: string, value: string, checked: boolean) => {
    const currentFilters = filters[column] || [];
    let newFilters;

    if (checked) {
      newFilters = [...currentFilters, value];
    } else {
      newFilters = currentFilters.filter(filterValue => filterValue !== value);
    }

    // Ajouter un log pour le débogage
    console.log(`Modifier filtre ${column}:`, { value, checked, newFilters });
    onFilterChange(column, newFilters);
  };

  const isCheckboxChecked = (column: string, value: string) => {
    return filters[column]?.includes(value) || false;
  };

  // Helper to format status values in French
  const translateStatus = (status: string): string => {
    switch (status.toLowerCase()) {
      case "pending": return "En attente";
      case "pending_assignment": return "En attente d'affectation";
      case "inprogress": return "En cours";
      case "in_progress": return "En cours";
      case "completed": return "Terminé";
      case "canceled": return "Annulé";
      default: return status;
    }
  };

  // Ensure all available statuses for the SDR are shown
  const getAllStatusOptions = () => {
    // Start with the unique values from requests
    let statuses = uniqueValues.status || [];

    // Make sure all possible workflow statuses are included
    const allPossibleStatuses = [
      "pending", "pending_assignment", "inprogress", "in_progress", "completed", "canceled"
    ];

    // Add any missing statuses
    allPossibleStatuses.forEach(status => {
      if (!statuses.includes(status)) {
        statuses.push(status);
      }
    });

    return statuses;
  };

  // Helper to render a filter button
  const renderFilterButton = (column: string, filterValues: string[]) => {
    const hasFilter = filters[column]?.length > 0;
    
    // Si this est la colonne status, obtenir tous les statuts possibles
    const valuesToShow = column === "status" ? getAllStatusOptions() : filterValues;
    
    // Log pour déboguer les valeurs disponibles pour ce filtre
    console.log(`renderFilterButton - ${column} values:`, valuesToShow);
    
    return (
      <Popover open={isFilterOpen(column)} onOpenChange={() => toggleFilter(column)}>
        <PopoverTrigger asChild>
          <Button 
            variant={hasFilter ? "default" : "ghost"} 
            size="icon"
            className={hasFilter ? "bg-blue-600 hover:bg-blue-700 text-white ml-2 h-7 w-7" : "ml-2 h-7 w-7"}
          >
            <Filter className="h-3.5 w-3.5" />
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
                  onClick={() => onFilterChange(column, [])}
                >
                  Effacer
                </Button>
              )}
            </div>
            
            <Separator />
            
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-4">
                {valuesToShow.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${column}-${option}`}
                      checked={isCheckboxChecked(column, option)}
                      onCheckedChange={(checked) => 
                        handleCheckboxChange(column, option, checked === true)
                      }
                    />
                    <Label htmlFor={`${column}-${option}`}>
                      {column === "status" ? translateStatus(option) : (option || "Non assigné")}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  // Helper for date filter
  const renderDateFilter = (column: string) => {
    const hasFilter = dateFilters[column]?.type;
    const currentType = dateFilterType[column] || dateFilters[column]?.type || "equals";
    const currentDate = selectedDate[column] || dateFilters[column]?.values?.date;
    
    return (
      <Popover open={isFilterOpen(column)} onOpenChange={() => toggleFilter(column)}>
        <PopoverTrigger asChild>
          <Button 
            variant={hasFilter ? "default" : "ghost"} 
            size="icon"
            className={hasFilter ? "bg-blue-600 hover:bg-blue-700 text-white ml-2 h-7 w-7" : "ml-2 h-7 w-7"}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span className="sr-only">Filtre {column}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="p-4 pb-0">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filtrer par date</h4>
              {hasFilter && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    onDateFilterChange(column, "", {});
                    setSelectedDate({...selectedDate, [column]: undefined});
                    setDateFilterType({...dateFilterType, [column]: "equals"});
                  }}
                >
                  Effacer
                </Button>
              )}
            </div>
            
            <Select 
              value={currentType} 
              onValueChange={(value) => {
                setDateFilterType({...dateFilterType, [column]: value});
                if (currentDate) {
                  onDateFilterChange(column, value, { date: currentDate });
                }
              }}
            >
              <SelectTrigger className="w-full mt-2">
                <SelectValue placeholder="Type de filtre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">Est égal à</SelectItem>
                <SelectItem value="before">Est avant</SelectItem>
                <SelectItem value="after">Est après</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="p-1">
            <CalendarComponent
              mode="single"
              selected={currentDate}
              onSelect={(date) => {
                setSelectedDate({...selectedDate, [column]: date});
                if (date) {
                  onDateFilterChange(
                    column,
                    dateFilterType[column] || "equals",
                    { date }
                  );
                }
              }}
              initialFocus
              locale={fr}
            />
          </div>
          
          {currentDate && (
            <div className="p-4 pt-0 border-t">
              <p className="text-sm">
                Date sélectionnée: {currentDate && format(currentDate, "P", { locale: fr })}
              </p>
            </div>
          )}
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <TableHeader>
      <TableRow>
        {/* Type */}
        <TableHead className="w-[100px]">
          <div className="flex items-center justify-between">
            Type
            {renderFilterButton("type", uniqueValues.type || [])}
          </div>
        </TableHead>

        {/* Mission */}
        <TableHead>
          <div className="flex items-center justify-between">
            Mission
            {renderFilterButton("mission", uniqueValues.mission || [])}
          </div>
        </TableHead>

        {/* Type de demande - CORRECTION: Utiliser les valeurs requestType */}
        <TableHead>
          <div className="flex items-center justify-between">
            Type de demande
            {renderFilterButton("requestType", uniqueValues.requestType || [])}
          </div>
        </TableHead>

        {/* SDR (conditionnel) */}
        {showSdr && (
          <TableHead>
            <div className="flex items-center justify-between">
              SDR
              {renderFilterButton("sdr", uniqueValues.sdr || [])}
            </div>
          </TableHead>
        )}

        {/* Assigné à - CORRECTION: Utiliser les valeurs assignedTo */}
        <TableHead>
          <div className="flex items-center justify-between">
            Assigné à
            {renderFilterButton("assignedTo", uniqueValues.assignedTo || [])}
          </div>
        </TableHead>

        {/* Plateforme d'emailing */}
        <TableHead>
          <div className="flex items-center justify-between">
            Plateforme d'emailing
            {renderFilterButton("emailPlatform", uniqueValues.emailPlatform || [])}
          </div>
        </TableHead>

        {/* Créée le */}
        <TableHead>
          <div className="flex items-center justify-between">
            <span className="cursor-pointer" onClick={() => handleSort("createdAt")}>
              Créée le
              {sortColumn === "createdAt" && (
                sortDirection === "asc" ? <ArrowUp className="ml-2 h-4 w-4 inline" /> : <ArrowDown className="ml-2 h-4 w-4 inline" />
              )}
            </span>
            {renderDateFilter("createdAt")}
          </div>
        </TableHead>

        {/* Date prévue */}
        <TableHead>
          <div className="flex items-center justify-between">
            <span className="cursor-pointer" onClick={() => handleSort("dueDate")}>
              Échéance
              {sortColumn === "dueDate" && (
                sortDirection === "asc" ? <ArrowUp className="ml-2 h-4 w-4 inline" /> : <ArrowDown className="ml-2 h-4 w-4 inline" />
              )}
            </span>
            {renderDateFilter("dueDate")}
          </div>
        </TableHead>

        {/* Statut */}
        <TableHead>
          <div className="flex items-center justify-between">
            Statut
            {renderFilterButton("status", uniqueValues.status || [])}
          </div>
        </TableHead>
        
        {/* Actions (remplace Titre) */}
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};
