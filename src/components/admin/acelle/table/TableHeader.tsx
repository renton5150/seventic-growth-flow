
import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface CampaignsTableHeaderProps {
  accountName: string;
  onRefresh: () => void;
  isSyncing: boolean;
}

export const CampaignsTableHeader: React.FC<CampaignsTableHeaderProps> = ({
  accountName,
  onRefresh,
  isSyncing
}) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-lg font-medium">Campagnes - {accountName}</h2>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onRefresh}
        disabled={isSyncing}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Actualisation...' : 'Actualiser'}
      </Button>
    </div>
  );
};
