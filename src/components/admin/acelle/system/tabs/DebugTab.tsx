
import React from "react";
import { Check, AlertTriangle, WifiOff } from "lucide-react";
import { AcelleConnectionDebug } from "@/types/acelle.types";
import { Button } from "@/components/ui/button";

interface DebugTabProps {
  debugInfo: AcelleConnectionDebug | null;
  onTestConnection?: () => void;
  isTestingConnection?: boolean;
}

export const DebugTab: React.FC<DebugTabProps> = ({ 
  debugInfo, 
  onTestConnection, 
  isTestingConnection = false 
}) => {
  // Fonction pour déterminer le type d'erreur et son affichage
  const getConnectionStatus = () => {
    if (!debugInfo) return { color: "bg-gray-50", text: "Aucun test effectué" };
    
    if (debugInfo.success) {
      return { color: "bg-green-50", text: "Connexion établie" };
    }
    
    // Détection de types d'erreurs spécifiques
    if (debugInfo.statusCode === 504 || debugInfo.errorMessage?.includes("timeout")) {
      return { color: "bg-amber-50", text: "Timeout de connexion" };
    }
    
    if (debugInfo.statusCode === 403) {
      return { color: "bg-red-50", text: "Erreur d'authentification" };
    }
    
    if (debugInfo.statusCode === 500) {
      return { color: "bg-red-50", text: "Erreur serveur API" };
    }
    
    if (debugInfo.statusCode === 502 || debugInfo.statusCode === 503) {
      return { color: "bg-red-50", text: "API indisponible" };
    }
    
    // Erreur générique
    return { color: "bg-red-50", text: "Erreur de connexion" };
  };
  
  const connectionStatus = getConnectionStatus();
  
  return (
    <div className="space-y-4">
      {onTestConnection && (
        <div className="mb-4 flex flex-col gap-2 p-4 border rounded-md">
          <h3 className="font-semibold">Diagnostic d'authentification API</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Ce test vérifie si vos identifiants API Acelle sont correctement configurés et si la méthode d'authentification fonctionne.
          </p>
          <Button 
            variant="outline" 
            onClick={onTestConnection} 
            disabled={isTestingConnection}
            className="w-full sm:w-auto"
          >
            {isTestingConnection ? "Test en cours..." : "Tester la connexion API"}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Note: Ce test utilise désormais l'authentification par paramètre URL (api_token) et par en-têtes HTTP pour une compatibilité maximale.
          </p>
        </div>
      )}
      
      {debugInfo && (
        <div className={`mt-4 p-4 rounded-md ${connectionStatus.color}`}>
          <div className="flex items-center">
            {debugInfo.success ? (
              <Check className="h-4 w-4 text-green-500 mr-2" />
            ) : debugInfo.statusCode === 504 ? (
              <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500 mr-2" />
            )}
            <span className={`text-sm font-medium ${
              debugInfo.success ? 'text-green-700' : 
              debugInfo.statusCode === 504 ? 'text-amber-700' : 'text-red-700'
            }`}>
              {connectionStatus.text}: {debugInfo.errorMessage || `Statut: ${debugInfo.statusCode || 'Inconnu'}`}
            </span>
          </div>
          
          {debugInfo.statusCode && (
            <div className="mt-2 text-xs text-muted-foreground">
              Code HTTP: {debugInfo.statusCode}
            </div>
          )}
          
          {debugInfo.duration && (
            <div className="mt-1 text-xs text-muted-foreground">
              Temps de réponse: {debugInfo.duration}ms
            </div>
          )}
          
          {debugInfo.authMethod && (
            <div className="mt-1 text-xs text-muted-foreground">
              Méthode d'authentification utilisée: {debugInfo.authMethod}
            </div>
          )}
          
          {!debugInfo.success && debugInfo.request && (
            <div className="mt-2 text-xs font-mono overflow-hidden text-ellipsis max-w-full">
              <details>
                <summary className="cursor-pointer text-muted-foreground">Détails de la requête</summary>
                <div className="p-2 mt-2 bg-gray-100 rounded text-muted-foreground">
                  <div>URL: {debugInfo.request.url?.substring(0, 100)}</div>
                  {debugInfo.request.headers && (
                    <div className="mt-1">
                      Headers: {JSON.stringify(debugInfo.request.headers, null, 2)}
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}
          
          {!debugInfo.success && debugInfo.responseData && (
            <div className="mt-2 text-xs font-mono overflow-hidden text-ellipsis max-w-full">
              <details>
                <summary className="cursor-pointer text-muted-foreground">Détails de la réponse</summary>
                <div className="p-2 mt-2 bg-gray-100 rounded text-muted-foreground">
                  {typeof debugInfo.responseData === 'object' 
                    ? JSON.stringify(debugInfo.responseData, null, 2)
                    : debugInfo.responseData}
                </div>
              </details>
            </div>
          )}
        </div>
      )}
      
      <div className="p-4 border rounded-md">
        <h3 className="font-semibold mb-2">Conseils de dépannage</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Vérifiez que votre session Supabase est active</li>
          <li>Essayez de "Réveiller les services" si les API sont inaccessibles</li>
          <li>Vérifiez les identifiants API dans les paramètres du compte</li>
          <li>La méthode d'authentification par paramètre URL (?api_token=) est maintenant utilisée</li>
          <li>Les en-têtes <code>X-Acelle-Token</code> et <code>X-Acelle-Endpoint</code> sont également supportés</li>
          <li>Si le cache est vide, synchronisez les campagnes depuis un compte valide</li>
          <li>En cas d'erreurs 403, vérifiez les permissions de votre compte Acelle</li>
          <li>En cas d'erreur 500, vérifiez que l'API est accessible directement depuis votre navigateur</li>
        </ul>
      </div>
    </div>
  );
};
