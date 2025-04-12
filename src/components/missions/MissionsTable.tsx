
import { useMemo, useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  ArrowDown, 
  ArrowUp, 
  Calendar, 
  Filter, 
  Search, 
  Trash, 
  Users, 
  X,
  CalendarCheck,
  CalendarDays
} from "lucide-react";
import { Mission } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Interface de base
interface MissionsTableProps {
  missions: Mission[];
  isAdmin: boolean;
  onViewMission: (mission: Mission) => void;
  onDeleteMission?: (mission: Mission) => void;
}

// Interface pour les filtres
interface Filters {
  searchTerm: string;
  sdrs: string[];
  dateRange: {
    type: 'between' | 'after' | 'before' | 'equal' | null;
    from: Date | null;
    to: Date | null;
  };
  requestsRange: {
    min: number | null;
    max: number | null;
  };
}

export const MissionsTable = ({ 
  missions, 
  isAdmin, 
  onViewMission,
  onDeleteMission 
}: MissionsTableProps) => {
  // État pour le tri
  const [sortColumn, setSortColumn] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  // État pour les filtres
  const [filters, setFilters] = useState<Filters>({
    searchTerm: "",
    sdrs: [],
    dateRange: {
      type: null,
      from: null,
      to: null
    },
    requestsRange: {
      min: null,
      max: null
    }
  });

  // État pour les dropdowns de filtres
  const [openFilterDropdown, setOpenFilterDropdown] = useState<string | null>(null);
  const [tempSdrFilters, setTempSdrFilters] = useState<string[]>([]);
  const [tempDateFilter, setTempDateFilter] = useState<{
    type: 'between' | 'after' | 'before' | 'equal' | null;
    from: Date | null;
    to: Date | null;
  }>({ type: null, from: null, to: null });
  const [tempRequestsRange, setTempRequestsRange] = useState<[number]>([0]);
  
  // Pour le debounce de la recherche
  const [searchInputValue, setSearchInputValue] = useState("");
  
  const formatDate = (date: Date) => {
    return format(new Date(date), "d MMM yyyy", { locale: fr });
  };
  
  // Liste unique des SDRs pour le filtrage
  const availableSdrs = useMemo(() => {
    const sdrSet = new Set<string>();
    missions.forEach(mission => {
      if (mission.sdrName) sdrSet.add(mission.sdrName);
    });
    return Array.from(sdrSet).sort();
  }, [missions]);

  // Valeur maximale pour le nombre de requêtes (pour le slider)
  const maxRequestCount = useMemo(() => {
    let max = 0;
    missions.forEach(mission => {
      if (mission.requests.length > max) max = mission.requests.length;
    });
    return Math.max(10, max); // Au moins 10 pour avoir une échelle raisonnable
  }, [missions]);
  
  // Fonction pour gérer le tri lorsqu'on clique sur un en-tête
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Inverser la direction si on clique sur la même colonne
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Nouvelle colonne, commencer par tri ascendant
      setSortColumn(column);
      setSortDirection("asc");
    }
  };
  
  // Fonction pour gérer l'ouverture et la fermeture des dropdowns de filtres
  const toggleFilterDropdown = (dropdown: string) => {
    if (openFilterDropdown === dropdown) {
      setOpenFilterDropdown(null);
    } else {
      setOpenFilterDropdown(dropdown);
      
      // Initialiser les valeurs temporaires
      if (dropdown === "sdr") {
        setTempSdrFilters([...filters.sdrs]);
      } else if (dropdown === "date") {
        setTempDateFilter({ ...filters.dateRange });
      } else if (dropdown === "requests") {
        setTempRequestsRange([filters.requestsRange.min || 0]);
      }
    }
  };
  
  // Appliquer les filtres SDR
  const applySdrFilter = () => {
    setFilters(prev => ({
      ...prev,
      sdrs: [...tempSdrFilters]
    }));
    setOpenFilterDropdown(null);
    toast.success(`Filtre appliqué: ${tempSdrFilters.length} SDR sélectionné${tempSdrFilters.length > 1 ? 's' : ''}`);
  };
  
  // Appliquer les filtres de date
  const applyDateFilter = () => {
    setFilters(prev => ({
      ...prev,
      dateRange: { ...tempDateFilter }
    }));
    setOpenFilterDropdown(null);
    
    if (tempDateFilter.type) {
      toast.success("Filtre de dates appliqué");
    } else {
      toast.success("Filtres de dates réinitialisés");
    }
  };
  
  // Appliquer les filtres de requêtes
  const applyRequestsFilter = () => {
    const min = tempRequestsRange[0];
    const max = min === maxRequestCount ? null : min;
    
    setFilters(prev => ({
      ...prev,
      requestsRange: {
        min,
        max
      }
    }));
    setOpenFilterDropdown(null);
    
    if (min > 0) {
      toast.success(`Filtre appliqué: ${min}+ requêtes`);
    } else {
      toast.success("Filtre de requêtes réinitialisé");
    }
  };

  // Toggle tous les SDRs
  const toggleAllSdrs = (select: boolean) => {
    if (select) {
      setTempSdrFilters([...availableSdrs]);
    } else {
      setTempSdrFilters([]);
    }
  };
  
  // Toggle un SDR spécifique
  const toggleSdr = (sdr: string) => {
    if (tempSdrFilters.includes(sdr)) {
      setTempSdrFilters(tempSdrFilters.filter(s => s !== sdr));
    } else {
      setTempSdrFilters([...tempSdrFilters, sdr]);
    }
  };
  
  // Réinitialiser tous les filtres
  const resetAllFilters = () => {
    setFilters({
      searchTerm: "",
      sdrs: [],
      dateRange: {
        type: null,
        from: null,
        to: null
      },
      requestsRange: {
        min: null,
        max: null
      }
    });
    setSearchInputValue("");
    toast.success("Tous les filtres ont été réinitialisés");
  };
  
  // Mettre à jour le filtre de recherche avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        searchTerm: searchInputValue.toLowerCase()
      }));
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchInputValue]);
  
  // Options pour le sélecteur de type de filtre date
  const dateFilterOptions = [
    { value: 'between', label: 'Se trouve entre', icon: CalendarDays },
    { value: 'after', label: 'Est après', icon: Calendar },
    { value: 'before', label: 'Est avant', icon: Calendar },
    { value: 'equal', label: 'Est égal à', icon: CalendarCheck }
  ];
  
  // Vérifier si le filtre de date temporaire est valide pour être appliqué
  const canApplyDateFilter = () => {
    if (!tempDateFilter.type) return false;
    
    if (tempDateFilter.type === 'between') {
      return !!tempDateFilter.from && !!tempDateFilter.to;
    }
    
    return !!tempDateFilter.from;
  };
  
  // Réinitialiser le filtre de date temporaire
  const resetDateFilter = () => {
    setTempDateFilter({ type: null, from: null, to: null });
  };
  
  // Gérer le changement de type de filtre date
  const handleDateFilterTypeChange = (type: 'between' | 'after' | 'before' | 'equal' | null) => {
    setTempDateFilter(prev => ({
      ...prev,
      type,
      // Réinitialiser to si on ne sélectionne plus "between"
      to: type === 'between' ? prev.to : null
    }));
  };
  
  // Obtenir la description du filtre de date pour l'afficher dans le badge
  const getDateFilterDescription = () => {
    if (!filters.dateRange.type || !filters.dateRange.from) return null;
    
    const formatDateShort = (date: Date) => format(date, "dd/MM/yyyy", { locale: fr });
    
    switch (filters.dateRange.type) {
      case 'between':
        if (!filters.dateRange.to) return null;
        return `Entre le ${formatDateShort(filters.dateRange.from)} et le ${formatDateShort(filters.dateRange.to)}`;
      case 'after':
        return `Après le ${formatDateShort(filters.dateRange.from)}`;
      case 'before':
        return `Avant le ${formatDateShort(filters.dateRange.from)}`;
      case 'equal':
        return `Le ${formatDateShort(filters.dateRange.from)}`;
      default:
        return null;
    }
  };
  
  // Composant pour les en-têtes triables
  const SortableHead = ({ column, children }: { column: string, children: React.ReactNode }) => {
    const isActive = sortColumn === column;
    
    return (
      <TableHead 
        onClick={() => handleSort(column)}
        className="cursor-pointer hover:bg-muted/30"
        aria-sort={isActive ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
        tabIndex={0}
      >
        <div className="flex items-center gap-2">
          {children}
          {isActive && (
            sortDirection === "asc" 
              ? <ArrowUp className="h-4 w-4" /> 
              : <ArrowDown className="h-4 w-4" />
          )}
        </div>
      </TableHead>
    );
  };
  
  // En-tête filtrable pour le SDR
  const FilterableSdrHead = () => {
    const isActive = filters.sdrs.length > 0;
    
    return (
      <TableHead className="relative">
        <DropdownMenu 
          open={openFilterDropdown === "sdr"} 
          onOpenChange={(open) => open ? toggleFilterDropdown("sdr") : setOpenFilterDropdown(null)}
        >
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/30 px-4 py-3">
              <span>SDR responsable</span>
              {isActive ? (
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                  {filters.sdrs.length}
                </Badge>
              ) : (
                <Filter className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60 p-2">
            <div className="flex justify-between py-2 px-2">
              <button 
                onClick={() => toggleAllSdrs(true)}
                className="text-xs text-blue-600 hover:underline"
              >
                Tout sélectionner
              </button>
              <button 
                onClick={() => toggleAllSdrs(false)}
                className="text-xs text-blue-600 hover:underline"
              >
                Tout désélectionner
              </button>
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-60 overflow-y-auto py-1">
              {availableSdrs.length > 0 ? (
                availableSdrs.map(sdr => (
                  <div key={sdr} className="flex items-center space-x-2 p-2 hover:bg-muted/30 rounded">
                    <Checkbox 
                      id={`sdr-${sdr}`}
                      checked={tempSdrFilters.includes(sdr)}
                      onCheckedChange={() => toggleSdr(sdr)}
                    />
                    <label 
                      htmlFor={`sdr-${sdr}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {sdr}
                    </label>
                  </div>
                ))
              ) : (
                <div className="p-2 text-sm text-muted-foreground">
                  Aucun SDR disponible
                </div>
              )}
            </div>
            <DropdownMenuSeparator />
            <div className="flex justify-end pt-2 px-2">
              <Button size="sm" onClick={applySdrFilter}>
                Appliquer
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableHead>
    );
  };
  
  // En-tête filtrable pour la date (nouveau système avancé)
  const FilterableDateHead = () => {
    const isActive = filters.dateRange.type !== null;
    
    return (
      <TableHead className="relative">
        <Popover 
          open={openFilterDropdown === "date"} 
          onOpenChange={(open) => open ? toggleFilterDropdown("date") : setOpenFilterDropdown(null)}
        >
          <PopoverTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/30 px-4 py-3">
              <span>Créée le</span>
              {isActive ? (
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                  <Calendar className="h-3 w-3 mr-1" />
                </Badge>
              ) : (
                <Calendar className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent align="start" side="bottom" className="w-80 p-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Type de filtre</h4>
                <RadioGroup 
                  value={tempDateFilter.type || ""} 
                  onValueChange={(value) => handleDateFilterTypeChange(value as any)}
                  className="grid grid-cols-2 gap-2"
                >
                  {dateFilterOptions.map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`date-filter-${option.value}`} />
                      <Label htmlFor={`date-filter-${option.value}`} className="flex items-center gap-1.5 cursor-pointer">
                        <option.icon className="h-3.5 w-3.5" />
                        <span>{option.label}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {tempDateFilter.type && (
                <>
                  {tempDateFilter.type === 'between' ? (
                    <div className="grid gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Date de début</h4>
                        <CalendarComponent
                          mode="single"
                          selected={tempDateFilter.from || undefined}
                          onSelect={(date) => setTempDateFilter(prev => ({ ...prev, from: date }))}
                          className="rounded border"
                          initialFocus
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2">Date de fin</h4>
                        <CalendarComponent
                          mode="single"
                          selected={tempDateFilter.to || undefined}
                          onSelect={(date) => setTempDateFilter(prev => ({ ...prev, to: date }))}
                          className="rounded border"
                          disabled={(date) => {
                            return tempDateFilter.from ? date < tempDateFilter.from : false;
                          }}
                          initialFocus={false}
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        {tempDateFilter.type === 'after' ? 'Date (après)' : 
                         tempDateFilter.type === 'before' ? 'Date (avant)' : 'Date exacte'}
                      </h4>
                      <CalendarComponent
                        mode="single"
                        selected={tempDateFilter.from || undefined}
                        onSelect={(date) => setTempDateFilter(prev => ({ ...prev, from: date }))}
                        className="rounded border"
                        initialFocus
                      />
                    </div>
                  )}
                </>
              )}
              
              {/* Résumé du filtre sélectionné */}
              {canApplyDateFilter() && (
                <div className="p-2 bg-blue-50 rounded-md text-sm">
                  <p className="font-medium">Filtre sélectionné:</p>
                  <p className="text-blue-700">
                    {tempDateFilter.type === 'between' && tempDateFilter.to ? 
                      `Entre le ${format(tempDateFilter.from!, "PPP", { locale: fr })} et le ${format(tempDateFilter.to, "PPP", { locale: fr })}` :
                     tempDateFilter.type === 'after' ? 
                      `Après le ${format(tempDateFilter.from!, "PPP", { locale: fr })}` :
                     tempDateFilter.type === 'before' ? 
                      `Avant le ${format(tempDateFilter.from!, "PPP", { locale: fr })}` :
                      `Le ${format(tempDateFilter.from!, "PPP", { locale: fr })}`
                    }
                  </p>
                </div>
              )}

              <div className="flex justify-between pt-2 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetDateFilter}
                >
                  Réinitialiser
                </Button>
                <Button 
                  size="sm" 
                  onClick={applyDateFilter}
                  disabled={!canApplyDateFilter()}
                >
                  Appliquer
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </TableHead>
    );
  };
  
  // En-tête filtrable pour les requêtes
  const FilterableRequestsHead = () => {
    const isActive = filters.requestsRange.min !== null;
    const currentValue = isActive ? filters.requestsRange.min : 0;
    
    return (
      <TableHead className="relative">
        <DropdownMenu 
          open={openFilterDropdown === "requests"} 
          onOpenChange={(open) => open ? toggleFilterDropdown("requests") : setOpenFilterDropdown(null)}
        >
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/30 px-4 py-3">
              <span>Demandes</span>
              {isActive ? (
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                  {currentValue}+
                </Badge>
              ) : (
                <Filter className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 p-4">
            <div>
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Minimum de demandes</span>
                  <span className="text-sm font-medium">{tempRequestsRange[0]}</span>
                </div>
                <Slider
                  value={tempRequestsRange}
                  onValueChange={(value) => setTempRequestsRange(value as [number])}
                  max={maxRequestCount}
                  step={1}
                />
              </div>
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setTempRequestsRange([0])}
                >
                  Réinitialiser
                </Button>
                <Button 
                  size="sm" 
                  onClick={applyRequestsFilter}
                >
                  Appliquer
                </Button>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableHead>
    );
  };
  
  // Appliquer tous les filtres avec useMemo pour optimiser les performances
  const filteredMissions = useMemo(() => {
    return missions.filter(mission => {
      // Filtre par terme de recherche
      if (filters.searchTerm && !mission.name.toLowerCase().includes(filters.searchTerm)) {
        return false;
      }
      
      // Filtre par SDR
      if (filters.sdrs.length > 0 && (!mission.sdrName || !filters.sdrs.includes(mission.sdrName))) {
        return false;
      }
      
      // Filtre par date (nouveau système avancé)
      if (filters.dateRange.type && filters.dateRange.from) {
        const missionDate = new Date(mission.createdAt);
        // Normaliser les dates (sans heure)
        missionDate.setHours(0, 0, 0, 0);
        
        const dateFrom = new Date(filters.dateRange.from);
        dateFrom.setHours(0, 0, 0, 0);
        
        switch (filters.dateRange.type) {
          case 'between':
            if (!filters.dateRange.to) return true;
            
            const dateTo = new Date(filters.dateRange.to);
            dateTo.setHours(23, 59, 59, 999); // Inclure toute la journée de fin
            
            return missionDate >= dateFrom && missionDate <= dateTo;
            
          case 'after':
            return missionDate >= dateFrom;
            
          case 'before':
            return missionDate <= dateFrom;
            
          case 'equal':
            const nextDay = new Date(dateFrom);
            nextDay.setDate(nextDay.getDate() + 1);
            return missionDate >= dateFrom && missionDate < nextDay;
        }
      }
      
      // Filtre par nombre de requêtes
      if (filters.requestsRange.min !== null && mission.requests.length < filters.requestsRange.min) {
        return false;
      }
      
      return true;
    });
  }, [missions, filters]);
  
  // Appliquer le tri avec useMemo pour optimiser les performances
  const sortedMissions = useMemo(() => {
    return [...filteredMissions].sort((a, b) => {
      const factor = sortDirection === "asc" ? 1 : -1;
      
      switch (sortColumn) {
        case "name":
          return a.name.localeCompare(b.name) * factor;
        case "sdr":
          return (a.sdrName || "").localeCompare(b.sdrName || "") * factor;
        case "createdAt":
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * factor;
        case "requests":
          return (a.requests.length - b.requests.length) * factor;
        default:
          return 0;
      }
    });
  }, [filteredMissions, sortColumn, sortDirection]);
  
  // Vérifier si des filtres sont actifs
  const hasActiveFilters = filters.searchTerm !== "" || 
                           filters.sdrs.length > 0 || 
                           filters.dateRange.type !== null || 
                           filters.requestsRange.min !== null;
  
  return (
    <Card className={`${isAdmin ? "border-blue-300" : "border-seventic-300"}`}>
      <CardHeader className={`${isAdmin ? "bg-blue-50" : "bg-seventic-50"}`}>
        <CardTitle>Liste des missions</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Barre de recherche */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
          <Input
            placeholder="Rechercher une mission par nom..."
            className="pl-10 pr-10"
            value={searchInputValue}
            onChange={(e) => setSearchInputValue(e.target.value)}
          />
          {searchInputValue && (
            <button 
              onClick={() => setSearchInputValue("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>
        
        {/* Indicateur de filtres actifs */}
        {hasActiveFilters && (
          <div className="mb-4 p-2 bg-blue-50 rounded flex items-center flex-wrap gap-2">
            <span className="text-sm text-gray-600">Filtres actifs:</span>
            
            {filters.searchTerm && (
              <Badge variant="outline" className="bg-blue-100 border-blue-300 text-blue-800 py-1 gap-1">
                Recherche: {filters.searchTerm}
                <button 
                  onClick={() => {
                    setFilters(prev => ({ ...prev, searchTerm: "" }));
                    setSearchInputValue("");
                  }}
                  className="ml-1 hover:bg-blue-200 rounded-full p-1"
                >
                  <X size={12} />
                </button>
              </Badge>
            )}
            
            {filters.sdrs.length > 0 && (
              <Badge variant="outline" className="bg-blue-100 border-blue-300 text-blue-800 py-1 gap-1">
                {filters.sdrs.length} SDR{filters.sdrs.length > 1 ? 's' : ''}
                <button 
                  onClick={() => setFilters(prev => ({ ...prev, sdrs: [] }))}
                  className="ml-1 hover:bg-blue-200 rounded-full p-1"
                >
                  <X size={12} />
                </button>
              </Badge>
            )}
            
            {filters.dateRange.type && (
              <Badge variant="outline" className="bg-blue-100 border-blue-300 text-blue-800 py-1 gap-1">
                {getDateFilterDescription()}
                <button 
                  onClick={() => setFilters(prev => ({ 
                    ...prev, 
                    dateRange: { type: null, from: null, to: null } 
                  }))}
                  className="ml-1 hover:bg-blue-200 rounded-full p-1"
                >
                  <X size={12} />
                </button>
              </Badge>
            )}
            
            {filters.requestsRange.min !== null && (
              <Badge variant="outline" className="bg-blue-100 border-blue-300 text-blue-800 py-1 gap-1">
                {filters.requestsRange.min}+ requêtes
                <button 
                  onClick={() => setFilters(prev => ({ ...prev, requestsRange: { min: null, max: null } }))}
                  className="ml-1 hover:bg-blue-200 rounded-full p-1"
                >
                  <X size={12} />
                </button>
              </Badge>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-auto text-blue-600 hover:text-blue-800 hover:bg-blue-100"
              onClick={resetAllFilters}
            >
              Réinitialiser tous les filtres
            </Button>
          </div>
        )}
        
        {/* Compteur de résultats */}
        <div className="mb-2 text-sm text-gray-500">
          {sortedMissions.length} mission{sortedMissions.length > 1 ? 's' : ''} trouvée{sortedMissions.length > 1 ? 's' : ''}
          {filteredMissions.length !== missions.length && (
            <> sur {missions.length}</>
          )}
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead column="name">Nom</SortableHead>
              <FilterableSdrHead />
              <FilterableDateHead />
              <FilterableRequestsHead />
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedMissions.length > 0 ? (
              sortedMissions.map((mission) => (
                <TableRow key={mission.id}>
                  <TableCell className="font-medium">{mission.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                      {mission.sdrName}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(mission.createdAt)}</TableCell>
                  <TableCell>{mission.requests.length}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onViewMission(mission)}
                        className={isAdmin ? "border-blue-500 hover:bg-blue-50" : ""}
                      >
                        Voir
                      </Button>
                      
                      {isAdmin && onDeleteMission && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onDeleteMission(mission)}
                          className="border-red-500 text-red-500 hover:bg-red-50"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Aucune mission ne correspond aux critères de recherche
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
