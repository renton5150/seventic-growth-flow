
import React, { useState } from "react";
import { AlertTriangle, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AcelleAccount, AcelleConnectionDebug } from "@/types/acelle.types";

interface ApiConnectionTesterProps {
  account: AcelleAccount;
  onTestComplete?: (success: boolean) => void;
}

// Mock function since the actual service is removed
const testAcelleConnection = async (endpoint: string, token: string, debug = false): Promise<boolean | AcelleConnectionDebug> => {
  console.warn("testAcelleConnection is mocked and always returns false as email campaign functionality has been removed");
  return false;
};

// Mock function for troubleshooting messages
const getTroubleshootingMessage = (errorMessage: string | null, endpoint: string): string => {
  return "Email campaign functionality has been removed from the application.";
};

export function ApiConnectionTester({ account, onTestComplete }: ApiConnectionTesterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<boolean | AcelleConnectionDebug | null>(null);
  const [debugInfo, setDebugInfo] = useState<AcelleConnectionDebug | null>(null);
  const [errorDetails, setErrorDetails] = useState<{code: number, message: string} | null>(null);

  const handleTest = async (withDebug = false) => {
    setIsLoading(true);
    setErrorDetails(null);
    try {
      const result = await testAcelleConnection(account.api_endpoint, account.api_token, withDebug);
      setTestResult(result);
      
      if (withDebug) {
        setDebugInfo(result as AcelleConnectionDebug);
        
        // Extraire les détails d'erreur pour une meilleure visualisation
        if (typeof result === 'object' && 'responseData' in result && result.responseData) {
          if (result.responseData.statusCode) {
            setErrorDetails({
              code: result.responseData.statusCode,
              message: result.responseData.message || result.responseData.error || 'Erreur inconnue'
            });
          }
        }
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

  const renderErrorHelp = () => {
    if (!errorDetails) return null;
    
    if (errorDetails.code === 403) {
      return (
        <div className="mt-2 text-sm">
          <p className="font-medium">Solutions possibles pour l'erreur 403 :</p>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li>Vérifiez que votre token API est correctement copié, sans espaces supplémentaires</li>
            <li>Assurez-vous que le token n'a pas expiré dans votre compte Acelle Mail</li>
            <li>Vérifiez les restrictions d'IP dans les paramètres d'Acelle Mail</li>
            <li>Essayez de générer un nouveau token API dans votre interface Acelle Mail</li>
          </ul>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Tester la connexion API</h3>
          <p className="text-sm text-muted-foreground">
            {account.name} ({account.api_endpoint})
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
                {getTroubleshootingMessage(getErrorMessage(), account.api_endpoint)}
                {renderErrorHelp()}
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

          <div className="mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => window.open("https://acelle.com/api-docs", "_blank")}
            >
              <ExternalLink className="h-3 w-3" />
              Documentation Acelle API
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
