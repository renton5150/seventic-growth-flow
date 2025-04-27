// Update to fix DateFilter type errors
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange } from 'react-day-picker';
import { format, isAfter, isBefore, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Download, Filter, Search, X } from "lucide-react";
import { DateFilter, DateFilterType, DateFilterValues } from "@/types/types";
import { WorkflowStatus } from "@/types/types";

interface GrowthTableHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: WorkflowStatus | "";
  setStatusFilter: (status: WorkflowStatus | "") => void;
  dateFilter: DateFilter;
  setDateFilter: (filter: DateFilter) => void;
  handleDownload: () => void;
  resetFilters: () => void;
}

export const GrowthTableHeader = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  handleDownload,
  resetFilters,
}) => {
  
  useEffect(() => {
    console.log("Date Filter:", dateFilter);
  }, [dateFilter]);
  
  // Fix DateFilter handling
  const handleDateFilterChange = (type: DateFilterType) => {
    if (type === "none") {
      setDateFilter({
        type: "none",
        values: { start: null, end: null, period: "" }
      });
      return;
    }

    if (type === "relative") {
      setDateFilter({
        type: "relative",
        values: { start: null, end: null, period: "this_week" }
      });
      return;
    }

    if (type === "absolute") {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      setDateFilter({
        type: "absolute",
        values: { start: today, end: nextWeek, period: "" }
      });
      return;
    }
  };

  const handleDateRangeChange = (range: DateRange) => {
    setDateFilter({
      type: "absolute",
      values: { start: range.from, end: range.to, period: "" }
    });
  };

  const handleRelativeFilterChange = (period: string) => {
    setDateFilter({
      type: "relative",
      values: { start: null, end: null, period }
    });
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex justify-between items-center">
        <div className="text-2xl font-bold">Demandes</div>
        <div className="flex space-x-2">
          <Button size="sm" onClick={resetFilters} variant="outline">
            <X className="h-4 w-4 mr-1" />
            Réinitialiser
          </Button>
          <Button size="sm" onClick={handleDownload} variant="outline">
            <Download className="h-4 w-4 mr-1" />
            Exporter
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher..." 
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={statusFilter || ""} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous les statuts</SelectItem>
            <SelectItem value="pending_assignment">À affecter</SelectItem>
            <SelectItem value="assigned">Affectés</SelectItem>
            <SelectItem value="in_progress">En cours</SelectItem>
            <SelectItem value="review">En revue</SelectItem>
            <SelectItem value="completed">Terminés</SelectItem>
            <SelectItem value="canceled">Annulés</SelectItem>
          </SelectContent>
        </Select>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <Filter className="h-4 w-4 mr-2" />
              {dateFilter.type === "none" 
                ? "Date" 
                : dateFilter.type === "relative" 
                  ? formatRelativeDateFilter(dateFilter.values.period) 
                  : formatAbsoluteDateFilter(dateFilter.values.start, dateFilter.values.end)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="end">
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Select 
                  value={dateFilter.type} 
                  onValueChange={handleDateFilterChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type de filtre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    <SelectItem value="relative">Période</SelectItem>
                    <SelectItem value="absolute">Dates spécifiques</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateFilter.type === "relative" && (
                <div className="flex flex-col gap-2">
                  <Select 
                    value={dateFilter.values.period}
                    onValueChange={handleRelativeFilterChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une période" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Aujourd'hui</SelectItem>
                      <SelectItem value="yesterday">Hier</SelectItem>
                      <SelectItem value="this_week">Cette semaine</SelectItem>
                      <SelectItem value="last_week">Semaine dernière</SelectItem>
                      <SelectItem value="this_month">Ce mois</SelectItem>
                      <SelectItem value="last_month">Mois dernier</SelectItem>
                      <SelectItem value="this_quarter">Ce trimestre</SelectItem>
                      <SelectItem value="last_quarter">Dernier trimestre</SelectItem>
                      <SelectItem value="this_year">Cette année</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {dateFilter.type === "absolute" && (
                <div>
                  <DateRangePicker
                    from={dateFilter.values.start || undefined}
                    to={dateFilter.values.end || undefined}
                    onSelect={(range) => handleDateRangeChange(range || { from: undefined, to: undefined })}
                    locale={fr}
                  />
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

// Helper function to format relative date
function formatRelativeDateFilter(period: string | undefined): string {
  if (!period) return "Période";
  
  const periodMap: Record<string, string> = {
    today: "Aujourd'hui",
    yesterday: "Hier",
    this_week: "Cette semaine",
    last_week: "Semaine dernière",
    this_month: "Ce mois",
    last_month: "Mois dernier",
    this_quarter: "Ce trimestre",
    last_quarter: "Dernier trimestre",
    this_year: "Cette année",
  };
  
  return periodMap[period] || "Période";
}

// Helper function to format absolute date range
function formatAbsoluteDateFilter(start: Date | null | undefined, end: Date | null | undefined): string {
  if (!start) return "Plage de dates";
  
  if (!end || start === end) {
    return format(start, "dd/MM/yyyy");
  }
  
  return `${format(start, "dd/MM")} - ${format(end, "dd/MM/yyyy")}`;
}

// Determine if a date is within the filter
export function isDateInFilter(date: Date, filter: DateFilter): boolean {
  if (filter.type === "none" || !date) return true;
  
  if (filter.type === "absolute") {
    const { start, end } = filter.values;
    if (!start) return true;
    
    if (!end) return isSameDay(date, start);
    
    return (
      (isSameDay(date, start) || isAfter(date, start)) && 
      (isSameDay(date, end) || isBefore(date, end))
    );
  }
  
  if (filter.type === "relative") {
    // Implementation for relative date filtering
    // This would need to be implemented based on your requirements
    return true;
  }
  
  return true;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
