import { useState, useEffect, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Search, Filter, X } from "lucide-react";
import { CheckboxColumnFilter } from "@/components/growth/filters/CheckboxColumnFilter";
import { DateColumnFilter } from "@/components/growth/filters/DateColumnFilter";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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

interface AdminTableWithFiltersProps {
  requests: SimpleRequest[];
  userProfiles: {[key: string]: string};
  missionNames: {[key: string]: string};
  onViewRequest: (requestId: string) => void;
}

export const AdminTableWithFilters = ({ 
  requests, 
  userProfiles, 
  missionNames, 
  onViewRequest 
}: AdminTableWithFiltersProps) => {
  const [filters, setFilters] = useState<{[key: string]: string[]}>({});
  const [dateFilters, setDateFilters] = useState<{[key: string]: any}>({});
  const [titleSearch, setTitleSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Extract unique values for filters
  const uniqueValues = useMemo(() => {
    const types = [...new Set(requests.map(r => r.type))];
    const missions = [...new Set(requests.map(r => r.mission_id ? missionNames[r.mission_id] || 'Mission inconnue' : 'Non assignée'))];
    const creators = [...new Set(requests.map(r => userProfiles[r.created_by] || 'Inconnu'))];
    const assignees = [...new Set(requests.map(r => r.assigned_to ? userProfiles[r.assigned_to] || 'Inconnu' : 'Non assigné'))];
    const statuses = [...new Set(requests.map(r => r.workflow_status))];

    return {
      type: types,
      mission: missions,
      createdBy: creators,
      assignedTo: assignees,
      status: statuses
    };
  }, [requests, userProfiles, missionNames]);

  // Filter requests based on active filters
  const filteredRequests = useMemo(() => {
    console.log('🔍 Filtrage en cours - dateFilters:', dateFilters);
    
    return requests.filter(request => {
      // Type filter
      if (filters.type && filters.type.length > 0) {
        if (!filters.type.includes(request.type)) return false;
      }

      // Mission filter
      if (filters.mission && filters.mission.length > 0) {
        const missionName = request.mission_id ? missionNames[request.mission_id] || 'Mission inconnue' : 'Non assignée';
        if (!filters.mission.includes(missionName)) return false;
      }

      // Creator filter
      if (filters.createdBy && filters.createdBy.length > 0) {
        const creatorName = userProfiles[request.created_by] || 'Inconnu';
        if (!filters.createdBy.includes(creatorName)) return false;
      }

      // Assignee filter
      if (filters.assignedTo && filters.assignedTo.length > 0) {
        const assigneeName = request.assigned_to ? userProfiles[request.assigned_to] || 'Inconnu' : 'Non assigné';
        if (!filters.assignedTo.includes(assigneeName)) return false;
      }

      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(request.workflow_status)) return false;
      }

      // Title search
      if (titleSearch && !request.title.toLowerCase().includes(titleSearch.toLowerCase())) {
        return false;
      }

      // Date filters - Fixed logic with debugging
      if (dateFilters.createdAt) {
        console.log('🗓️ Filtre createdAt:', dateFilters.createdAt);
        const createdDate = new Date(request.created_at);
        const result = applyDateFilter(createdDate, dateFilters.createdAt);
        console.log('🗓️ Résultat filtre createdAt:', result, 'pour date:', createdDate);
        if (!result) return false;
      }

      if (dateFilters.dueDate) {
        console.log('🗓️ Filtre dueDate:', dateFilters.dueDate);
        const dueDate = new Date(request.due_date);
        const result = applyDateFilter(dueDate, dateFilters.dueDate);
        console.log('🗓️ Résultat filtre dueDate:', result, 'pour date:', dueDate);
        if (!result) return false;
      }

      return true;
    });
  }, [requests, filters, dateFilters, titleSearch, userProfiles, missionNames]);

  const applyDateFilter = (date: Date, filter: any) => {
    console.log('🔍 applyDateFilter - date:', date, 'filter:', filter);
    
    if (!filter || !filter.type) {
      console.log('🔍 Pas de filtre ou pas de type, retour true');
      return true;
    }
    
    try {
      switch (filter.type) {
        case 'equals':
          if (filter.date) {
            const filterDate = new Date(filter.date);
            const result = date.toDateString() === filterDate.toDateString();
            console.log('🔍 equals - filterDate:', filterDate, 'result:', result);
            return result;
          }
          break;
        case 'before':
          if (filter.date) {
            const filterDate = new Date(filter.date);
            const result = date < filterDate;
            console.log('🔍 before - filterDate:', filterDate, 'result:', result);
            return result;
          }
          break;
        case 'after':
          if (filter.date) {
            const filterDate = new Date(filter.date);
            const result = date > filterDate;
            console.log('🔍 after - filterDate:', filterDate, 'result:', result);
            return result;
          }
          break;
        case 'between':
          if (filter.startDate && filter.endDate) {
            const startDate = new Date(filter.startDate);
            const endDate = new Date(filter.endDate);
            const result = date >= startDate && date <= endDate;
            console.log('🔍 between - startDate:', startDate, 'endDate:', endDate, 'result:', result);
            return result;
          }
          break;
        default:
          console.log('🔍 Type de filtre non reconnu:', filter.type);
          return true;
      }
    } catch (error) {
      console.error('❌ Erreur lors du filtrage de date:', error, 'filter:', filter);
      return true;
    }
    
    console.log('🔍 Fin de applyDateFilter sans match, retour true');
    return true;
  };

  const handleFilterChange = (column: string, values: string[]) => {
    setFilters(prev => ({
      ...prev,
      [column]: values
    }));
  };

  const handleDateFilterChange = (field: string, type: string | null, values: any) => {
    console.log('📅 handleDateFilterChange - field:', field, 'type:', type, 'values:', values);
    
    setDateFilters(prev => {
      if (type === null) {
        // Remove the filter
        console.log('📅 Suppression du filtre pour:', field);
        const newFilters = { ...prev };
        delete newFilters[field];
        return newFilters;
      }
      
      // Restructurer correctement les données
      const newFilter = {
        type,
        ...values // values contient déjà { date } ou { startDate, endDate }
      };
      
      console.log('📅 Nouveau filtre créé:', newFilter);
      
      const newFilters = {
        ...prev,
        [field]: newFilter
      };
      
      console.log('📅 Tous les filtres après mise à jour:', newFilters);
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setFilters({});
    setDateFilters({});
    setTitleSearch("");
  };

  const hasActiveFilters = Object.keys(filters).some(key => filters[key]?.length > 0) || 
                          Object.keys(dateFilters).length > 0 || 
                          titleSearch.length > 0;

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

  const formatDateWithTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy à HH:mm", { locale: fr });
    } catch (error) {
      console.error('❌ Erreur formatage date:', error, 'dateString:', dateString);
      return dateString;
    }
  };

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
            Filtres {hasActiveFilters && `(${Object.keys(filters).filter(k => filters[k]?.length > 0).length + Object.keys(dateFilters).length + (titleSearch ? 1 : 0)})`}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              <X className="h-4 w-4 mr-2" />
              Effacer tout
            </Button>
          )}
        </div>
        <div className="text-sm text-gray-600">
          {filteredRequests.length} demande(s) affichée(s) sur {requests.length}
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
            {filteredRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  {getTypeBadge(request.type)}
                </TableCell>
                <TableCell className="font-medium">
                  <div className="max-w-[150px] truncate" title={request.mission_id ? missionNames[request.mission_id] || 'Mission inconnue' : 'Non assignée'}>
                    {request.mission_id ? missionNames[request.mission_id] || 'Mission inconnue' : 'Non assignée'}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  <div className="max-w-[200px] truncate" title={request.title}>
                    {request.title}
                  </div>
                </TableCell>
                <TableCell>
                  {userProfiles[request.created_by] || 'Inconnu'}
                </TableCell>
                <TableCell>
                  {request.assigned_to ? userProfiles[request.assigned_to] || 'Inconnu' : 'Non assigné'}
                </TableCell>
                <TableCell>
                  {getStatusBadge(request.status, request.workflow_status)}
                </TableCell>
                <TableCell>
                  {formatDateWithTime(request.created_at)}
                </TableCell>
                <TableCell>
                  {formatDateWithTime(request.due_date)}
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
        
        {filteredRequests.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p>Aucune demande trouvée avec les filtres actifs</p>
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAllFilters}
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
