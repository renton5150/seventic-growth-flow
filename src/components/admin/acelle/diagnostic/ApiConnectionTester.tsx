import React, { useState } from "react";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AcelleAccount, AcelleConnectionDebug } from "@/types/acelle.types";
import { testAcelleConnection } from "@/services/acelle/acelle-service";
import { getTroubleshootingMessage } from "@/utils/acelle/campaignStatusUtils";

interface ApiConnectionTesterProps {
  account: AcelleAccount;
  onTestComplete?: (success: boolean) => void;
}

export function ApiConnectionTester({ account, onTestComplete }: ApiConnectionTesterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<boolean | AcelleConnectionDebug | null>(null);
  const [debugInfo, setDebugInfo] = useState<AcelleConnectionDebug | null>(null);

  const handleTest = async (withDebug = false) => {
    setIsLoading(true);
    try {
      const result = await testAcelleConnection(account.apiEndpoint, account.apiToken, withDebug);
      setTestResult(result);
      
      if (withDebug) {
        setDebugInfo(result as AcelleConnectionDebug);
      }
      
      if (onTestComplete) {
        if (typeof result === "boolean") {
          onTestComplete(result);
        } 
        else if (result && 'success' in result) {
          onTestComplete(result.success);
        }
      }
    } catch (error) {
      console.error("Test connection error:", error);
      setTestResult(false);
      if (onTestComplete) onTestComplete(false);
    } finally {
      setIsLoading(false);
    }
  };

  const isSuccess = () => {
    if (testResult === null) return false;
    if (typeof testResult === "boolean") return testResult;
    return testResult.success;
  };

  const getErrorMessage = () => {
    if (testResult === null || testResult === true) return null;
    if (typeof testResult === "boolean") return "La connexion à l'API a échoué";
    return testResult.errorMessage || "Erreur de connexion inconnue";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Tester la connexion API</h3>
          <p className="text-sm text-muted-foreground">
            {account.name} ({account.apiEndpoint})
          </p>
        </div>
        
        <div className="space-x-2">
          <Button 
            variant="outline" 
            onClick={() => handleTest()} 
            disabled={isLoading}
          >
            Test simple
          </Button>
          <Button 
            onClick={() => handleTest(true)} 
            disabled={isLoading}
          >
            {isLoading ? "Test en cours..." : "Test détaillé"}
          </Button>
        </div>
      </div>
      
      {testResult !== null && (
        <>
          <Alert variant={isSuccess() ? "default" : "destructive"}>
            {isSuccess() ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {isSuccess() ? "Connexion établie" : "Échec de connexion"}
            </AlertTitle>
            <AlertDescription>
              {isSuccess() 
                ? "La connexion à l'API Acelle Mail a été établie avec succès." 
                : getErrorMessage()
              }
            </AlertDescription>
          </Alert>
          
          {!isSuccess() && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Dépannage</AlertTitle>
              <AlertDescription className="text-sm">
                {getTroubleshootingMessage(getErrorMessage(), account.apiEndpoint)}
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
      
      {debugInfo && (
        <div className="mt-4 space-y-2">
          <Separator />
          <h4 className="text-sm font-medium pt-2">Informations de diagnostic</h4>
          
          <div className="rounded border p-3 bg-muted/30 text-xs font-mono overflow-auto max-h-[200px]">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
