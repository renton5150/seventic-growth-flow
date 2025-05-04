
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Bug, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AcelleTableFilters } from "../table/AcelleTableFilters";
import { AcelleTableSyncHeader } from "../table/AcelleTableSyncHeader";

interface TableHeaderProps {
  onRefresh: () => void;
  onSync: () => void;
  toggleDemoMode: (enable: boolean) => void;
  demoMode: boolean;
  isRefreshing: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  cacheInfo: {
    size: number;
    lastUpdated: Date | null;
  };
  connectionError: string | null;
  syncError: string | null;
}

export function TableHeader({
  onRefresh,
  onSync,
  toggleDemoMode,
  demoMode,
  isRefreshing,
  isSyncing,
  lastSyncTime,
  cacheInfo,
  connectionError,
  syncError
}: TableHeaderProps) {
  // État pour suivre le filtre et la recherche
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string | null>(null);

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <AcelleTableFilters 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
        
        <div className="flex flex-wrap gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onSync}
            disabled={isSyncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
            Synchroniser
          </Button>
          
          <Button
            variant={demoMode ? "destructive" : "outline"}
            size="sm"
            onClick={() => toggleDemoMode(!demoMode)}
          >
            <Bug className="h-4 w-4 mr-2" />
            {demoMode ? "Désactiver démo" : "Mode démo"}
          </Button>
        </div>
      </div>
      
      {!demoMode && (
        <AcelleTableSyncHeader
          lastSyncTime={lastSyncTime}
          isSyncing={isSyncing}
          onSyncClick={onSync}
          className="mb-4"
          cacheInfo={cacheInfo}
        />
      )}
      
      {connectionError && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 text-amber-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <p>{connectionError}</p>
          </CardContent>
        </Card>
      )}
      
      {syncError && (
        <Card className="bg-red-50 border-red-200 mb-4">
          <CardContent className="p-4 text-red-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p>{syncError}</p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
