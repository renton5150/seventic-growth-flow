
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface AcelleTableSyncHeaderProps {
  lastSyncTime: Date | null;
  isSyncing: boolean;
  onSyncClick: () => void;
  className?: string;
}

export const AcelleTableSyncHeader = ({
  lastSyncTime,
  isSyncing,
  onSyncClick,
  className = ""
}: AcelleTableSyncHeaderProps) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center text-sm text-muted-foreground">
        {lastSyncTime && (
          <>
            <Calendar className="h-4 w-4 mr-1" />
            <span>
              Dernière synchronisation {formatDistanceToNow(lastSyncTime, { addSuffix: true, locale: fr })}
            </span>
          </>
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
