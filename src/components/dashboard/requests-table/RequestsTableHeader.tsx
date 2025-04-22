
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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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
  onDateFilterChange
}: RequestsTableHeaderProps) => {
  const [openFilters, setOpenFilters] = useState<{[key: string]: boolean}>({});

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

    onFilterChange(column, newFilters);
  };

  const isCheckboxChecked = (column: string, value: string) => {
    return filters[column]?.includes(value) || false;
  };

  // Helper to render a filter button
  const renderFilterButton = (column: string, uniqueValues: string[]) => {
    const hasFilter = filters[column]?.length > 0;
    
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
                {uniqueValues.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${column}-${option}`}
                      checked={isCheckboxChecked(column, option)}
                      onCheckedChange={(checked) => 
                        handleCheckboxChange(column, option, checked === true)
                      }
                    />
                    <Label htmlFor={`${column}-${option}`}>{option || "Non assigné"}</Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[100px]">
          <div className="flex items-center justify-between">
            Type
            {renderFilterButton("type", ["email", "database", "linkedin"])}
          </div>
        </TableHead>
        <TableHead>
          <div className="flex items-center justify-between">
            Titre
            {renderFilterButton("title", ["Titre 1", "Titre 2"])}
          </div>
        </TableHead>
        <TableHead>
          <div className="flex items-center justify-between">
            Mission
            {renderFilterButton("mission", ["Mission 1", "Mission 2"])}
          </div>
        </TableHead>
        {showSdr && (
          <TableHead>
            <div className="flex items-center justify-between">
              SDR
              {renderFilterButton("sdr", ["SDR 1", "SDR 2"])}
            </div>
          </TableHead>
        )}
        <TableHead>
          <div className="flex items-center justify-between">
            Statut
            {renderFilterButton("status", ["pending", "inprogress", "completed", "canceled"])}
          </div>
        </TableHead>
        <TableHead>
          <div className="flex items-center justify-between cursor-pointer" onClick={() => handleSort("dueDate")}>
            Échéance
            {sortColumn === "dueDate" && (
              sortDirection === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
            )}
          </div>
        </TableHead>
        <TableHead>
          <div className="flex items-center justify-between cursor-pointer" onClick={() => handleSort("createdAt")}>
            Créée le
            {sortColumn === "createdAt" && (
              sortDirection === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
            )}
          </div>
        </TableHead>
        
        <TableHead>
          <div className="flex items-center justify-between">
            Plateforme d'emailing
            {renderFilterButton("emailPlatform", ["Acelmail", "Brevo", "Mindbaz", "Mailjet", "Postyman", "Mailwizz"])}
          </div>
        </TableHead>
        
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};
