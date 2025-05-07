
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, RefreshCw, Wifi, WifiOff, ZapOff, Zap } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AcelleAccount } from "@/types/acelle.types";
import { checkDirectApiConnection } from "@/services/acelle/api/campaignStats";
import { runAcelleDiagnostic, forceRefreshAuthToken } from "@/services/acelle/cors-proxy";

interface ConnectionTesterProps {
  account?: AcelleAccount;
  className?: string;
}

export function ConnectionTester({ account, className }: ConnectionTesterProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);
  const [testResults, setTestResults] = useState<{
    system: {
      success: boolean;
      auth: boolean;
      cors: boolean;
      details?: any;
    } | null;
    api: {
      success: boolean;
      message: string;
      details?: any;
    } | null;
  }>({
    system: null,
    api: null
  });
  
  // Fonction pour exécuter un test complet de connectivité
  const runConnectionTest = async () => {
    if (isTesting) return;
    
    setIsTesting(true);
    setTestResults({
      system: null,
      api: null
    });
    
    toast.loading("Test de connexion en cours...", { id: "connection-test" });
    
    try {
      // 1. Tester d'abord les services système
      const systemDiagnostic = await runAcelleDiagnostic();
      
      const systemResult = {
        success: systemDiagnostic.success,
        auth: systemDiagnostic.results.auth.success,
        cors: systemDiagnostic.results.proxy.corsProxy && systemDiagnostic.results.proxy.acelleProxy,
        details: systemDiagnostic
      };
      
      setTestResults(prev => ({
        ...prev,
        system: systemResult
      }));
      
      // 2. Si le système est OK et qu'un compte est fourni, tester l'API
      if (systemDiagnostic.success && account) {
        const apiResult = await checkDirectApiConnection(account);
        
        setTestResults(prev => ({
          ...prev,
          api: apiResult
        }));
        
        // Déterminer le message global
        if (apiResult.success) {
          toast.success("Connexion complète réussie", { id: "connection-test" });
        } else {
          toast.error(`Échec de connexion à l'API: ${apiResult.message}`, { id: "connection-test" });
        }
      } else if (!systemDiagnostic.success) {
        toast.error("Problème avec les services système", { id: "connection-test" });
      } else if (!account) {
        toast.warning("Aucun compte sélectionné pour tester l'API", { id: "connection-test" });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Erreur lors du test: ${errorMessage}`, { id: "connection-test" });
      
      setTestResults(prev => ({
        ...prev,
        system: prev.system || {
          success: false,
          auth: false,
          cors: false,
          details: { error: errorMessage }
        }
      }));
    } finally {
      setIsTesting(false);
    }
  };
  
  // Fonction pour rafraîchir le token d'authentification
  const refreshToken = async () => {
    setIsRefreshingToken(true);
    toast.loading("Rafraîchissement du token...", { id: "refresh-token" });
    
    try {
      const newToken = await forceRefreshAuthToken();
      
      if (newToken) {
        toast.success("Token rafraîchi avec succès", { id: "refresh-token" });
        // Exécuter à nouveau le test après le rafraîchissement
        await runConnectionTest();
      } else {
        toast.error("Échec du rafraîchissement du token", { id: "refresh-token" });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Erreur: ${errorMessage}`, { id: "refresh-token" });
    } finally {
      setIsRefreshingToken(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Wifi className="mr-2 h-4 w-4" />
          Testeur de Connectivité
        </CardTitle>
        <CardDescription>
          Diagnostiquer les problèmes de connexion à l'API Acelle
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* État du système */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-sm">État du système</h3>
            {testResults.system && (
              <Badge variant={testResults.system.success ? "default" : "destructive"} className="ml-auto">
                {testResults.system.success ? "OK" : "Problème"}
              </Badge>
            )}
          </div>
          
          {testResults.system ? (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full mr-2 
                  bg-${testResults.system.auth ? "green" : "red"}-500"></span>
                Authentification
              </div>
              <div>
                {testResults.system.auth ? "Active" : "Inactive"}
                {!testResults.system.auth && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-7 ml-2"
                    onClick={refreshToken}
                    disabled={isRefreshingToken}
                  >
                    {isRefreshingToken ? 
                      <RefreshCw className="h-3 w-3 animate-spin" /> : 
                      "Rafraîchir"}
                  </Button>
                )}
              </div>
              
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full mr-2 
                  bg-${testResults.system.cors ? "green" : "red"}-500"></span>
                Services CORS
              </div>
              <div>{testResults.system.cors ? "En ligne" : "Hors ligne"}</div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Exécutez un test pour voir l'état du système
            </div>
          )}
        </div>
        
        {/* Connexion API */}
        {account && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-sm flex items-center">
                Connexion API 
                <span className="text-xs text-muted-foreground ml-2">
                  ({account.name})
                </span>
              </h3>
              {testResults.api && (
                <Badge variant={testResults.api.success ? "default" : "destructive"} className="ml-auto">
                  {testResults.api.success ? "Connecté" : "Déconnecté"}
                </Badge>
              )}
            </div>
            
            {testResults.api ? (
              <div className="bg-gray-50 p-3 rounded-md border">
                <div className="flex items-center mb-2">
                  {testResults.api.success ? 
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" /> : 
                    <AlertCircle className="h-4 w-4 mr-2 text-red-500" />}
                  <span className="text-sm">
                    {testResults.api.message}
                  </span>
                </div>
                
                {testResults.api.details && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground">
                      Détails techniques
                    </summary>
                    <pre className="mt-2 bg-gray-100 p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(testResults.api.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Exécutez un test pour vérifier la connexion API
              </div>
            )}
          </div>
        )}
        
        {/* Résultat global */}
        {(testResults.system || testResults.api) && (
          <Alert variant={
            (testResults.system?.success && (!account || testResults.api?.success)) ? 
            "default" : "destructive"
          }>
            <div className="flex items-center">
              {(testResults.system?.success && (!account || testResults.api?.success)) ? (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  <AlertTitle>Connexion établie</AlertTitle>
                </>
              ) : (
                <>
                  <ZapOff className="h-4 w-4 mr-2" />
                  <AlertTitle>Problème de connexion</AlertTitle>
                </>
              )}
            </div>
            <AlertDescription>
              {testResults.system?.success && (!account || testResults.api?.success) ? (
                "Tous les services sont opérationnels et connectés"
              ) : !testResults.system?.success ? (
                "Problème avec les services système. Vérifiez votre connexion et authentification."
              ) : (
                "Problème avec l'API Acelle. Vérifiez les paramètres du compte."
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          onClick={runConnectionTest} 
          disabled={isTesting}
          variant="default"
        >
          {isTesting ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Test en cours...
            </>
          ) : (
            <>
              <WifiOff className="mr-2 h-4 w-4" />
              Tester la connexion
            </>
          )}
        </Button>
        
        <Button 
          variant="outline"
          onClick={() => {
            setTestResults({
              system: null,
              api: null
            });
          }}
        >
          Effacer les résultats
        </Button>
      </CardFooter>
    </Card>
  );
}
