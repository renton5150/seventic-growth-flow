
import React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CampaignsTableHeaderProps {
  accountName: string;
  onRefresh: () => void;
  isSyncing: boolean;
}

export const CampaignsTableHeader = ({
  accountName,
  onRefresh,
  isSyncing,
}: CampaignsTableHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-medium">
        Campagnes de <span className="font-semibold">{accountName}</span>
      </h3>
      <Button
        onClick={onRefresh}
        variant="outline"
        size="sm"
        disabled={isSyncing}
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
        {isSyncing ? "Actualisation..." : "Actualiser"}
      </Button>
    </div>
  );
};

