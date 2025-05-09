
import React from "react";
import { Check, AlertTriangle } from "lucide-react";
import { AcelleConnectionDebug } from "@/types/acelle.types";

interface DebugTabProps {
  debugInfo: AcelleConnectionDebug | null;
}

export const DebugTab: React.FC<DebugTabProps> = ({ debugInfo }) => {
  return (
    <div className="space-y-4">
      {debugInfo && (
        <div className={`mt-4 p-4 rounded-md ${debugInfo.success ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-center">
            {debugInfo.success ? (
              <Check className="h-4 w-4 text-green-500 mr-2" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
            )}
            <span className={`text-sm ${debugInfo.success ? 'text-green-700' : 'text-red-700'}`}>
              {debugInfo.errorMessage || `Statut: ${debugInfo.statusCode || 'Inconnu'}`}
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
          <li>Si le cache est vide, synchronisez les campagnes depuis un compte valide</li>
          <li>En cas d'erreurs 403, vérifiez les permissions de votre compte Acelle</li>
        </ul>
      </div>
    </div>
  );
};
