
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Calendar, Database } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface AcelleTableSyncHeaderProps {
  lastSyncTime: Date | null;
  isSyncing: boolean;
  onSyncClick: () => void;
  className?: string;
  cacheInfo?: {
    size: number;
    lastUpdated: Date | null;
  };
}

export const AcelleTableSyncHeader = ({
  lastSyncTime,
  isSyncing,
  onSyncClick,
  className = "",
  cacheInfo
}: AcelleTableSyncHeaderProps) => {
  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-2 ${className}`}>
      <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground">
        {lastSyncTime && (
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span>
              Dernière synchronisation {formatDistanceToNow(lastSyncTime, { addSuffix: true, locale: fr })}
            </span>
          </div>
        )}
        
        {cacheInfo && cacheInfo.lastUpdated && (
          <div className="flex items-center">
            <Database className="h-4 w-4 mr-1" />
            <span>
              {cacheInfo.size} statistiques en cache 
              {cacheInfo.lastUpdated && ` (mis à jour ${formatDistanceToNow(cacheInfo.lastUpdated, { addSuffix: true, locale: fr })})`}
            </span>
          </div>
        )}
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onSyncClick}
        disabled={isSyncing}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
        {isSyncing ? "Synchronisation..." : "Synchroniser"}
      </Button>
    </div>
  );
};
