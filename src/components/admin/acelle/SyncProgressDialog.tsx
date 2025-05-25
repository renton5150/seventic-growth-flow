
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { RefreshCw } from "lucide-react";

interface SyncProgressDialogProps {
  isOpen: boolean;
  progress: {
    current: number;
    total: number;
    message: string;
  };
}

export const SyncProgressDialog: React.FC<SyncProgressDialogProps> = ({
  isOpen,
  progress
}) => {
  const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Synchronisation complète
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="text-sm text-muted-foreground">
            {progress.message}
          </div>
          
          {progress.total > 0 && (
            <>
              <Progress value={percentage} className="w-full" />
              <div className="text-xs text-center text-muted-foreground">
                {progress.current} / {progress.total} ({percentage}%)
              </div>
            </>
          )}
          
          {progress.total === 0 && (
            <div className="flex justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
