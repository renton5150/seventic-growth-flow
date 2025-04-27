
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { testAcelleConnection } from "@/services/acelle/api/connection";
import { AcelleAccount } from "@/types/acelle.types";

interface ApiConnectionTesterProps {
  account: AcelleAccount;
  onTestComplete?: (success: boolean) => void;
}

export const ApiConnectionTester = ({ account, onTestComplete }: ApiConnectionTesterProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testStartTime, setTestStartTime] = useState<number | null>(null);

  const runConnectionTest = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setTestResult(null);
    setTestStartTime(Date.now());
    toast.loading("Test de connexion en cours...", { id: "connection-test" });
    
    try {
      const result = await testAcelleConnection(account.apiEndpoint, account.apiToken, true);
      setTestResult(result);
      
      if (typeof result === 'boolean') {
        if (result) {
          toast.success("Connexion réussie à l'API Acelle", { id: "connection-test" });
        } else {
          toast.error("Échec de connexion à l'API Acelle", { id: "connection-test" });
        }
      } else {
        // We have detailed debug info
        if (result.success) {
          toast.success("Connexion réussie à l'API Acelle", { id: "connection-test" });
        } else {
          toast.error(`Échec de connexion: ${result.errorMessage || 'Erreur inconnue'}`, { id: "connection-test" });
        }
      }
      
      if (onTestComplete) {
        onTestComplete(result.success || result === true);
      }
    } catch (error) {
      console.error("Error during connection test:", error);
      toast.error(`Erreur de test: ${error.message}`, { id: "connection-test" });
      setTestResult({ success: false, errorMessage: error.message });
      
      if (onTestComplete) {
        onTestComplete(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderTestResult = () => {
    if (!testResult) return null;
    
    const elapsedTime = testStartTime ? ((Date.now() - testStartTime) / 1000).toFixed(2) + 's' : 'N/A';
    const success = typeof testResult === 'boolean' ? testResult : testResult.success;
    
    return (
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {success ? 
              <CheckCircle className="h-5 w-5 text-green-500" /> : 
              <XCircle className="h-5 w-5 text-red-500" />
            }
            <span className={`font-medium ${success ? 'text-green-700' : 'text-red-700'}`}>
              {success ? 'Connexion réussie' : 'Échec de connexion'}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">Temps: {elapsedTime}</span>
        </div>
        
        <Separator />
        
        {typeof testResult !== 'boolean' && (
          <div className="space-y-4">
            <div className="text-sm">
              <div className="font-medium mb-1">Détails:</div>
              <div className="p-3 bg-gray-50 rounded-md overflow-auto text-xs font-mono max-h-48 text-wrap">
                {testResult.errorMessage && (
                  <div className="mb-2 text-red-600">{testResult.errorMessage}</div>
                )}
                {testResult.statusCode && (
                  <div className="mb-2">Status: <span className={testResult.statusCode >= 200 && testResult.statusCode < 300 ? 'text-green-600' : 'text-red-600'}>{testResult.statusCode}</span></div>
                )}
                {testResult.responseData && (
                  <pre className="whitespace-pre-wrap">{JSON.stringify(testResult.responseData, null, 2)}</pre>
                )}
              </div>
            </div>
            
            {!success && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Suggestions de dépannage:</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>Vérifiez que l'URL de l'API est correcte et accessible</li>
                      <li>Assurez-vous que votre token API est valide et non expiré</li>
                      <li>Vérifiez que l'adresse IP du serveur n'est pas bloquée</li>
                      <li>Confirmez que votre compte Acelle a les permissions nécessaires</li>
                      <li>Vérifiez les paramètres de sécurité dans votre installation Acelle</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Diagnostic de connexion API</CardTitle>
        <CardDescription>
          Teste la connectivité avec l'API Acelle Mail pour le compte {account.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col space-y-1">
            <span className="text-sm font-medium">URL de l'API:</span>
            <span className="text-sm font-mono bg-gray-50 p-2 rounded-md">
              {account.apiEndpoint || "Non défini"}
            </span>
          </div>
          
          <div className="flex flex-col space-y-1">
            <span className="text-sm font-medium">Token API:</span>
            <span className="text-sm font-mono bg-gray-50 p-2 rounded-md">
              {account.apiToken ? `${account.apiToken.substring(0, 10)}...` : "Non défini"}
            </span>
          </div>
          
          {renderTestResult()}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline"
          size="sm"
          onClick={() => window.open('https://acellemail.com/documentation', '_blank')}
          className="text-xs"
        >
          <ExternalLink className="h-3 w-3 mr-1" /> Documentation Acelle
        </Button>
        
        <Button onClick={runConnectionTest} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Test en cours...
            </>
          ) : (
            'Tester la connexion'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
