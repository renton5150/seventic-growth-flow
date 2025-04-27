
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TableHeaderProps {
  accountName: string;
  onRefresh: () => void;
  isSyncing: boolean;
}

export const CampaignsTableHeader = ({ accountName, onRefresh, isSyncing }: TableHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold">Campagnes - {accountName}</h2>
      <Button 
        onClick={onRefresh} 
        disabled={isSyncing} 
        variant="outline"
      >
        {isSyncing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Synchronisation...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Synchroniser
          </>
        )}
      </Button>
    </div>
  );
};
