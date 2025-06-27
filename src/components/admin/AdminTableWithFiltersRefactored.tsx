
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Search, Filter, X } from "lucide-react";
import { CheckboxColumnFilter } from "@/components/growth/filters/CheckboxColumnFilter";
import { DateColumnFilter } from "@/components/growth/filters/DateColumnFilter";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAdminRequestsFilters } from "@/hooks/useAdminRequestsFilters";

interface SimpleRequest {
  id: string;
  title: string;
  type: string;
  status: string;
  workflow_status: string;
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  due_date: string;
  mission_id: string | null;
}

interface AdminTableWithFiltersRefactoredProps {
  requests: SimpleRequest[];
  userProfiles: {[key: string]: string};
  missionNames: {[key: string]: string};
  onViewRequest: (requestId: string) => void;
}

export const AdminTableWithFiltersRefactored = ({ 
  requests, 
  userProfiles, 
  missionNames, 
  onViewRequest 
}: AdminTableWithFiltersRefactoredProps) => {
  const [titleSearch, setTitleSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const {
    filteredAndSortedRequests,
    sortColumn,
    sortDirection,
    filters,
    dateFilters,
    uniqueValues,
    handleSort,
    handleFilterChange,
    handleDateFilterChange,
    clearAllFilters,
    hasActiveFilters
  } = useAdminRequestsFilters(requests, userProfiles, missionNames);

  // Filtrer par titre après les autres filtres
  const finalFilteredRequests = filteredAndSortedRequests.filter(request => {
    if (titleSearch && !request.title.toLowerCase().includes(titleSearch.toLowerCase())) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status: string, workflowStatus: string) => {
    if (workflowStatus === 'completed') {
      return <Badge variant="outline" className="bg-green-100 text-green-800">Terminée</Badge>;
    }
    if (workflowStatus === 'in_progress') {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800">En cours</Badge>;
    }
    return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">En attente</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      'email_campaign': 'bg-purple-100 text-purple-800',
      'database_creation': 'bg-orange-100 text-orange-800',
      'linkedin_scraping': 'bg-blue-100 text-blue-800'
    };
    const color = colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    return <Badge variant="outline" className={color}>{type}</Badge>;
  };

  const formatDateWithTime = (dateInput: string | Date) => {
    try {
      const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
      return format(date, "dd/MM/yyyy à HH:mm", { locale: fr });
    } catch (error) {
      console.error('❌ Erreur formatage date:', error, 'dateInput:', dateInput);
      return String(dateInput);
    }
  };

  const handleClearAllFilters = () => {
    clearAllFilters();
    setTitleSearch("");
  };

  const totalActiveFilters = Object.keys(filters).filter(k => filters[k]?.length > 0).length + 
                           Object.keys(dateFilters).length + 
                           (titleSearch ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtres {totalActiveFilters > 0 && `(${totalActiveFilters})`}
          </Button>
          {(hasActiveFilters || titleSearch) && (
            <Button variant="ghost" size="sm" onClick={handleClearAllFilters}>
              <X className="h-4 w-4 mr-2" />
              Effacer tout
            </Button>
          )}
        </div>
        <div className="text-sm text-gray-600">
          {finalFilteredRequests.length} demande(s) affichée(s) sur {requests.length}
        </div>
      </div>

      {/* Search */}
      {showFilters && (
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans les titres..."
            value={titleSearch}
            onChange={(e) => setTitleSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      )}

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <div className="flex flex-col space-y-2">
                  <span>Type</span>
                  {showFilters && (
                    <CheckboxColumnFilter
                      values={uniqueValues.type}
                      selectedValues={filters.type || []}
                      onSelectionChange={(selected) => handleFilterChange('type', selected)}
                    />
                  )}
                </div>
              </TableHead>
              <TableHead>
                <div className="flex flex-col space-y-2">
                  <span>Mission</span>
                  {showFilters && (
                    <CheckboxColumnFilter
                      values={uniqueValues.mission}
                      selectedValues={filters.mission || []}
                      onSelectionChange={(selected) => handleFilterChange('mission', selected)}
                    />
                  )}
                </div>
              </TableHead>
              <TableHead>Titre</TableHead>
              <TableHead>
                <div className="flex flex-col space-y-2">
                  <span>Créé par</span>
                  {showFilters && (
                    <CheckboxColumnFilter
                      values={uniqueValues.createdBy}
                      selectedValues={filters.createdBy || []}
                      onSelectionChange={(selected) => handleFilterChange('createdBy', selected)}
                    />
                  )}
                </div>
              </TableHead>
              <TableHead>
                <div className="flex flex-col space-y-2">
                  <span>Assigné à</span>
                  {showFilters && (
                    <CheckboxColumnFilter
                      values={uniqueValues.assignedTo}
                      selectedValues={filters.assignedTo || []}
                      onSelectionChange={(selected) => handleFilterChange('assignedTo', selected)}
                    />
                  )}
                </div>
              </TableHead>
              <TableHead>
                <div className="flex flex-col space-y-2">
                  <span>Statut</span>
                  {showFilters && (
                    <CheckboxColumnFilter
                      values={uniqueValues.status}
                      selectedValues={filters.status || []}
                      onSelectionChange={(selected) => handleFilterChange('status', selected)}
                    />
                  )}
                </div>
              </TableHead>
              <TableHead>
                <div className="flex flex-col space-y-2">
                  <span>Date création</span>
                  {showFilters && (
                    <DateColumnFilter
                      selectedFilter={dateFilters.createdAt}
                      onFilterChange={(type, values) => handleDateFilterChange('createdAt', type, values)}
                    />
                  )}
                </div>
              </TableHead>
              <TableHead>
                <div className="flex flex-col space-y-2">
                  <span>Date limite</span>
                  {showFilters && (
                    <DateColumnFilter
                      selectedFilter={dateFilters.dueDate}
                      onFilterChange={(type, values) => handleDateFilterChange('dueDate', type, values)}
                    />
                  )}
                </div>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {finalFilteredRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  {getTypeBadge(request.type)}
                </TableCell>
                <TableCell className="font-medium">
                  <div className="max-w-[150px] truncate" title={request.missionName || 'Mission inconnue'}>
                    {request.missionName || 'Mission inconnue'}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  <div className="max-w-[200px] truncate" title={request.title}>
                    {request.title}
                  </div>
                </TableCell>
                <TableCell>
                  {request.sdrName || 'Inconnu'}
                </TableCell>
                <TableCell>
                  {request.assignedToName || 'Non assigné'}
                </TableCell>
                <TableCell>
                  {getStatusBadge(request.status, request.workflow_status)}
                </TableCell>
                <TableCell>
                  {formatDateWithTime(request.createdAt)}
                </TableCell>
                <TableCell>
                  {formatDateWithTime(request.dueDate)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onViewRequest(request.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {finalFilteredRequests.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p>Aucune demande trouvée avec les filtres actifs</p>
            {(hasActiveFilters || titleSearch) && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearAllFilters}
                className="mt-2"
              >
                Effacer tous les filtres
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
