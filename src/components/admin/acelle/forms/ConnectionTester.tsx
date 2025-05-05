
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { AcelleConnectionDebug } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";
import { testAcelleConnection } from "@/services/acelle/api/connection";

interface ConnectionTesterProps {
  apiEndpoint: string;
  apiToken: string;
}

export function ConnectionTester({ apiEndpoint, apiToken }: ConnectionTesterProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [connectionResult, setConnectionResult] = useState<AcelleConnectionDebug | null>(null);

  async function testConnection() {
    setIsTesting(true);
    setConnectionResult(null);
    
    try {
      if (!apiEndpoint || !apiToken) {
        throw new Error("Veuillez remplir les champs URL API et Token API");
      }
      
      // Récupérer le token d'authentification
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      if (!token) {
        throw new Error("Erreur d'authentification");
      }
      
      const result = await testAcelleConnection(apiEndpoint, apiToken, token);
      setConnectionResult(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setConnectionResult({
        success: false,
        timestamp: new Date().toISOString(),
        errorMessage: errorMessage
      });
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button type="button" onClick={testConnection} disabled={isTesting} className="flex-1">
          {isTesting ? <Spinner className="mr-2 h-4 w-4" /> : null}
          Tester la connexion
        </Button>
      </div>
      
      {connectionResult && (
        <Card className={connectionResult.success ? 'bg-green-50' : 'bg-red-50'}>
          <CardContent className="p-4">
            <p className={`font-medium ${connectionResult.success ? 'text-green-600' : 'text-red-600'}`}>
              {connectionResult.success ? 'Connexion réussie' : `Échec de la connexion: ${connectionResult.errorMessage}`}
            </p>
            {connectionResult.success && connectionResult.apiVersion && (
              <p className="mt-1 text-sm text-green-600">Version API: {connectionResult.apiVersion}</p>
            )}
            {connectionResult.success && connectionResult.responseTime && (
              <p className="mt-1 text-sm text-green-600">Temps de réponse: {connectionResult.responseTime} ms</p>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
