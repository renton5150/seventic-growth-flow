
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, FilterX, Search } from "lucide-react";
import { MissionFilters } from "@/hooks/useMissionsList";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MissionStatus, MissionType } from "@/types/types";
import { cn } from "@/lib/utils";

interface MissionsFilterProps {
  filters: MissionFilters;
  updateFilters: (filters: Partial<MissionFilters>) => void;
  isSdr?: boolean;
}

export const MissionsFilter = ({ 
  filters, 
  updateFilters, 
  isSdr = false 
}: MissionsFilterProps) => {
  const [searchQuery, setSearchQuery] = useState(filters.search || "");
  
  const handleSearch = () => {
    updateFilters({ search: searchQuery });
  };
  
  const handleReset = () => {
    setSearchQuery("");
    updateFilters({
      search: undefined,
      status: undefined,
      type: undefined,
      startDate: undefined,
      endDate: undefined
    });
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };
  
  return (
    <div className="bg-white p-4 rounded-md border mb-4">
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1">
          <div className="relative">
            <Input
              placeholder="Rechercher une mission..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              className="pr-10"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSearch}
              className="absolute right-0 top-0 h-full"
            >
              <Search size={18} />
              <span className="sr-only">Rechercher</span>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:flex gap-2">
          <div className="w-full md:w-40">
            <Select
              value={filters.status || ""}
              onValueChange={(value) => updateFilters({ status: value ? value as MissionStatus : undefined })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les statuts</SelectItem>
                <SelectItem value="En cours">En cours</SelectItem>
                <SelectItem value="Terminé">Terminé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-40">
            <Select
              value={filters.type || ""}
              onValueChange={(value) => updateFilters({ type: value ? value as MissionType : undefined })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les types</SelectItem>
                <SelectItem value="Full">Full</SelectItem>
                <SelectItem value="Part">Part</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal md:w-[240px]"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.startDate ? (
                  format(filters.startDate, "d MMMM yyyy", { locale: fr })
                ) : (
                  "Date de début"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.startDate || undefined}
                onSelect={(date) => updateFilters({ startDate: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal md:w-[240px]"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.endDate ? (
                  format(filters.endDate, "d MMMM yyyy", { locale: fr })
                ) : (
                  "Date de fin"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.endDate || undefined}
                onSelect={(date) => updateFilters({ endDate: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Button 
            variant="outline" 
            onClick={handleReset}
            className="gap-2"
          >
            <FilterX size={16} />
            Réinitialiser
          </Button>
        </div>
      </div>
    </div>
  );
};
