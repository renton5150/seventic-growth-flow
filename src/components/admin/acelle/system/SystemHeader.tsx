
import React from "react";
import { Power, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardTitle } from "@/components/ui/card";

interface SystemHeaderProps {
  authStatus: boolean | null;
  isTesting: boolean;
  wakeUpEdgeFunctions: () => Promise<boolean>;
  runDiagnostics: () => Promise<void>;
}

export const SystemHeader: React.FC<SystemHeaderProps> = ({ 
  authStatus, 
  isTesting, 
  wakeUpEdgeFunctions, 
  runDiagnostics 
}) => {
  return (
    <div className="flex flex-row items-center justify-between">
      <CardTitle className="flex items-center gap-2">
        État du système
        <Badge variant={authStatus ? "default" : "destructive"} className="ml-2">
          {authStatus ? "Authentifié" : "Non authentifié"}
        </Badge>
      </CardTitle>
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={wakeUpEdgeFunctions}
          disabled={isTesting}
        >
          <Power className="h-4 w-4 mr-2" />
          Réveiller les services
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={runDiagnostics}
          disabled={isTesting}
        >
          {isTesting ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {isTesting ? "Test en cours..." : "Tester les services"}
        </Button>
      </div>
    </div>
  );
};
