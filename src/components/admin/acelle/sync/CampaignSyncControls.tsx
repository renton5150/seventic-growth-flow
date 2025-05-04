
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Database, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface CampaignSyncControlsProps {
  lastSyncTime: Date | null;
  isSyncing: boolean;
  campaignsCount: number;
  onSyncClick: () => void;
  syncError?: string | null;
}

export const CampaignSyncControls = ({
  lastSyncTime,
  isSyncing,
  campaignsCount,
  onSyncClick,
  syncError
}: CampaignSyncControlsProps) => {
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-blue-500" />
            <div>
              <p className="font-medium">
                {campaignsCount} campagnes en cache
                {lastSyncTime && (
                  <span className="text-muted-foreground ml-2 text-sm">
                    (mis à jour {formatDistanceToNow(lastSyncTime, { addSuffix: true, locale: fr })})
                  </span>
                )}
              </p>
              {syncError && (
                <div className="flex items-center gap-2 text-red-500 text-sm mt-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{syncError}</span>
                </div>
              )}
            </div>
          </div>
          
          <Button 
            onClick={onSyncClick} 
            disabled={isSyncing}
            variant="outline"
            className="ml-auto"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Synchronisation..." : "Synchroniser maintenant"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
