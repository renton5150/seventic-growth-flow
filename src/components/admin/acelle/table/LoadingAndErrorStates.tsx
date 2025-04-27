
import React from 'react';
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

interface LoadingStateProps {
  colSpan: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ colSpan }) => {
  return (
    <TableBody>
      <TableRow>
        <TableCell colSpan={colSpan} className="h-24 text-center">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">Chargement des données...</span>
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  );
};

interface ErrorStateProps {
  colSpan: number;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ colSpan, message, onRetry }) => {
  return (
    <TableBody>
      <TableRow>
        <TableCell colSpan={colSpan} className="h-24 text-center">
          <div className="flex flex-col items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
            <span className="text-sm text-muted-foreground mb-2">{message}</span>
            {onRetry && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
                className="mt-2"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  );
};
