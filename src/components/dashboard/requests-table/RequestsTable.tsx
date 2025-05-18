
import { useState, useEffect } from "react";
import { Request } from "@/types/types";
import { Table } from "@/components/ui/table";
import { RequestsTableHeader } from "./RequestsTableHeader";
import { RequestsTableBody } from "./RequestsTableBody";
import { sortRequests } from "@/utils/requestSorting";

interface RequestsTableProps {
  requests: Request[];
  missionView?: boolean;
  showSdr?: boolean;
  isSDR?: boolean;
  onRequestDeleted?: () => void;
}

export const RequestsTable = ({ 
  requests, 
  missionView = false, 
  showSdr = false,
  isSDR = false,
  onRequestDeleted
}: RequestsTableProps) => {
  const [sortColumn, setSortColumn] = useState<string>("dueDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState<{[key: string]: string[]}>({});
  const [dateFilters, setDateFilters] = useState<{[key: string]: any}>({});
  const [uniqueValues, setUniqueValues] = useState<{[key: string]: string[]}>({
    type: [],
    title: [],
    mission: [],
    sdr: [],
    status: [],
    assignedTo: [], // Ajout explicite de assignedTo
    requestType: [], // Ajout explicite de requestType
    emailPlatform: []
  });

  // Extraire les valeurs uniques des propriétés pour les filtres
  useEffect(() => {
    if (!requests || requests.length === 0) return;
    
    // Extract unique values for filters
    const types = [...new Set(requests.map(r => r.type))];
    
    // Use proper "Sans mission" for null or empty mission names
    const missions = [...new Set(requests.map(r => r.missionName || "Sans mission"))];
    
    // Use "Non assigné" for null or empty SDR names
    const sdrs = [...new Set(requests.map(r => r.sdrName || "Non assigné"))];
    
    // Get unique statuses - include all possible workflow statuses
    const statuses = [...new Set(requests.map(r => {
      return r.workflow_status || r.status || "pending";
    }))];
    
    // Get unique titles
    const titles = [...new Set(requests.map(r => r.title))];
    
    // Extract email platforms from request details
    const emailPlatforms = [...new Set(requests.map(r => {
      if (r.details && r.details.emailPlatform) {
        return r.details.emailPlatform;
      }
      return "Non spécifié";
    }))];
    
    // CORRECTION: Extraire les types de demande formatés avec les labels français
    const requestTypes = [...new Set(requests.map(r => {
      switch(r.type) {
        case "email": return "Campagne Email";
        case "database": return "Base de données";
        case "linkedin": return "Scraping LinkedIn";
        default: return r.type;
      }
    }))];
    
    // CORRECTION: Extraire les valeurs uniques pour assignedTo
    const assignedToNames = [...new Set(requests.map(r => r.assignedToName || "Non assigné"))];
    
    // Ajouter des logs pour déboguer l'extraction des valeurs de filtre
    console.log("RequestsTable - Valeurs extraites pour les filtres:", {
      requestTypes,
      assignedToNames
    });
    
    setUniqueValues({
      type: types,
      mission: missions,
      sdr: sdrs,
      status: statuses,
      title: titles,
      emailPlatform: emailPlatforms,
      requestType: requestTypes, // Ajouter les types de demande formatés
      assignedTo: assignedToNames // Ajouter les noms des personnes assignées
    });
  }, [requests]);

  const filteredAndSortedRequests = sortRequests(requests, sortColumn, sortDirection, filters, dateFilters);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleFilterChange = (column: string, values: string[]) => {
    console.log(`Applying filter on ${column}:`, values);
    setFilters(prev => ({
      ...prev,
      [column]: values
    }));
  };

  const handleDateFilterChange = (field: string, type: string, values: any) => {
    console.log(`Applying date filter on ${field}:`, { type, values });
    setDateFilters(prev => ({
      ...prev,
      [field]: type ? { type, values } : undefined
    }));
  };

  return (
    <div className="rounded-md border">
      <Table>
        <RequestsTableHeader 
          missionView={missionView} 
          handleSort={handleSort}
          showSdr={showSdr}
          isSDR={isSDR}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          filters={filters}
          dateFilters={dateFilters}
          onFilterChange={handleFilterChange}
          onDateFilterChange={handleDateFilterChange}
          uniqueValues={uniqueValues}
        />
        <RequestsTableBody 
          sortedRequests={filteredAndSortedRequests} 
          missionView={missionView}
          showSdr={showSdr}
          isSDR={isSDR}
          onRequestDeleted={onRequestDeleted}
        />
      </Table>
    </div>
  );
};
