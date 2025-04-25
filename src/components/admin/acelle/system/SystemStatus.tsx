
import { useState } from "react";
import { Check, X, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { AcelleConnectionDebug } from "@/types/acelle.types";
import { useCampaignSync } from "@/hooks/acelle/useCampaignSync";
import { useAuth } from "@/contexts/AuthContext";
import { testAcelleConnection } from "@/services/acelle/api/connection";

export const SystemStatus = () => {
  const { isAdmin } = useAuth();
  const { syncCampaignsCache, wakeUpEdgeFunctions } = useCampaignSync();
  const [isTesting, setIsTesting] = useState(false);
  const [endpointStatus, setEndpointStatus] = useState<{[key: string]: boolean}>({});
  const [lastTestTime, setLastTestTime] = useState<Date | null>(null);
  const [debugInfo, setDebugInfo] = useState<AcelleConnectionDebug | null>(null);

  if (!isAdmin) return null;

  const runDiagnostics = async () => {
    setIsTesting(true);
    try {
      // Use wakeUpEdgeFunctions to check API accessibility
      const apiAccess = await wakeUpEdgeFunctions();
      
      const status = {
        endpoints: {
          campaigns: apiAccess,
          details: apiAccess
        }
      };
      
      setEndpointStatus(status.endpoints || {});
      setLastTestTime(new Date());
      
      if (apiAccess) {
        toast.success("Tous les services sont opérationnels");
      } else {
        toast.error("Certains services sont indisponibles");
      }
    } catch (error) {
      console.error("Erreur lors du diagnostic:", error);
      toast.error("Erreur lors du test des services");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>État du système</CardTitle>
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
          Tester les services
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">API Campaigns:</span>
              {endpointStatus.campaigns ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">API Details:</span>
              {endpointStatus.details ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
          
          {debugInfo && debugInfo.errorMessage && (
            <div className="mt-4 p-4 bg-red-50 rounded-md">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-sm text-red-700">{debugInfo.errorMessage}</span>
              </div>
            </div>
          )}
          
          {lastTestTime && (
            <div className="text-sm text-muted-foreground mt-4">
              Dernier test: {lastTestTime.toLocaleString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
