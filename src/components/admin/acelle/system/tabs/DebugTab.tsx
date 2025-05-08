
import React from "react";
import { Check, AlertTriangle, WifiOff, FileQuestion, RefreshCw, Key, ShieldAlert } from "lucide-react";
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
    if (!debugInfo) return { color: "bg-gray-50", text: "Aucun test effectué", icon: null };
    
    if (debugInfo.success) {
      return { color: "bg-green-50", text: "Connexion établie", icon: <Check className="h-4 w-4 text-green-500 mr-2" /> };
    }
    
    // Détection de types d'erreurs spécifiques
    if (debugInfo.statusCode === 504 || debugInfo.isTimeout || debugInfo.errorMessage?.includes("timeout")) {
      return { 
        color: "bg-amber-50", 
        text: "Timeout de connexion", 
        icon: <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
      };
    }
    
    if (debugInfo.statusCode === 404) {
      return { 
        color: "bg-purple-50", 
        text: "Ressource non trouvée", 
        icon: <FileQuestion className="h-4 w-4 text-purple-500 mr-2" />
      };
    }
    
    if (debugInfo.statusCode === 403) {
      return { 
        color: "bg-red-50", 
        text: "Erreur d'authentification", 
        icon: <Key className="h-4 w-4 text-red-500 mr-2" />
      };
    }
    
    if (debugInfo.statusCode === 500) {
      return { 
        color: "bg-red-50", 
        text: "Erreur serveur API", 
        icon: <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
      };
    }
    
    if (debugInfo.statusCode === 502 || debugInfo.statusCode === 503) {
      return { 
        color: "bg-red-50", 
        text: "API indisponible", 
        icon: <WifiOff className="h-4 w-4 text-red-500 mr-2" />
      };
    }
    
    // Erreur générique
    return { 
      color: "bg-red-50", 
      text: "Erreur de connexion", 
      icon: <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
    };
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
            {isTestingConnection ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isTestingConnection ? "Test en cours..." : "Tester la connexion API"}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Le test utilise désormais plusieurs méthodes d'authentification pour une compatibilité maximale: paramètres URL, en-têtes HTTP et combinaisons mixtes.
          </p>
        </div>
      )}
      
      {debugInfo && (
        <div className={`mt-4 p-4 rounded-md ${connectionStatus.color}`}>
          <div className="flex items-center">
            {connectionStatus.icon}
            <span className={`text-sm font-medium ${
              debugInfo.success ? 'text-green-700' : 
              debugInfo.statusCode === 504 || debugInfo.isTimeout ? 'text-amber-700' : 
              debugInfo.statusCode === 404 ? 'text-purple-700' :
              debugInfo.statusCode === 403 ? 'text-red-700' :
              'text-red-700'
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
          
          {/* Affichage spécifique pour l'erreur 403 - NOUVELLE SECTION */}
          {debugInfo.statusCode === 403 && (
            <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
              <strong>Erreur d'authentification (403 Forbidden)</strong>: Le serveur a compris votre requête mais refuse de l'autoriser.
              <ul className="list-disc pl-5 mt-2 space-y-1.5">
                <li>Vérifiez que votre token API est toujours valide</li>
                <li>Connectez-vous directement à l'interface web Acelle pour confirmer vos identifiants</li>
                <li>Le compte peut avoir des restrictions d'IP ou des permissions limitées</li>
                <li>Essayez de régénérer le token API depuis l'interface admin d'Acelle</li>
                <li>Vérifiez que le compte n'est pas suspendu ou désactivé</li>
              </ul>
              
              <div className="mt-3 p-2 bg-red-100 rounded">
                <strong>Correction appliquée:</strong> Le système teste désormais plusieurs méthodes d'authentification simultanément pour maximiser la compatibilité:
                <ul className="list-disc pl-5 mt-1">
                  <li>Paramètre URL (<code>api_token=...</code>)</li>
                  <li>En-tête <code>Authorization: Bearer</code></li>
                  <li>En-tête <code>X-API-TOKEN</code></li>
                  <li>En-tête <code>API-Token</code></li>
                  <li>Combinaison de toutes ces méthodes</li>
                </ul>
              </div>
            </div>
          )}
          
          {/* Affichage spécifique pour l'erreur 404 - EXISTANT */}
          {debugInfo.statusCode === 404 && (
            <div className="mt-2 text-xs text-purple-600 bg-purple-50 p-2 rounded border border-purple-200">
              <strong>Ressource non trouvée (404)</strong>: L'URL demandée n'existe pas sur l'API Acelle.
              <ul className="list-disc pl-5 mt-2 space-y-1.5">
                <li>Vérifiez le chemin d'API utilisé et ses préfixes</li>
                <li><strong>Attention aux doublons de préfixe</strong>: Si l'endpoint contient déjà "/api/v1", ne répétez pas ce préfixe dans le chemin</li>
                <li>Confirmez que la ressource existe dans votre version d'Acelle</li>
                <li>Essayez un endpoint simple comme "/me" pour vérifier l'authentification</li>
                <li>Vérifiez l'URL exacte dans les logs de la fonction Edge</li>
                <li>Vérifiez que la plateforme Acelle Mail est bien en ligne</li>
              </ul>
              
              <div className="mt-3 p-2 bg-purple-100 rounded">
                <strong>Correction appliquée:</strong> Le système a été mis à jour pour éviter la duplication du préfixe "/api/v1/" dans les URLs d'API.
              </div>
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
          <li><strong>IMPORTANT:</strong> Vérifiez si votre URL d'API contient déjà "/api/v1" pour éviter la duplication</li>
          <li>Plusieurs méthodes d'authentification sont maintenant testées automatiquement</li>
          <li>Si le cache est vide, synchronisez les campagnes depuis un compte valide</li>
          <li>En cas d'erreurs 403, vérifiez les permissions de votre compte Acelle et la validité du token</li>
          <li>En cas d'erreur 404, vérifiez la structure correcte des URLs d'API</li>
          <li>En cas d'erreur 500, vérifiez que l'API est accessible directement depuis votre navigateur</li>
        </ul>
      </div>
      
      {/* Nouvelle section pour les problèmes d'authentification spécifiques */}
      <div className="p-4 border rounded-md border-amber-200 bg-amber-50">
        <h3 className="font-semibold mb-2 flex items-center">
          <ShieldAlert className="h-4 w-4 mr-2 text-amber-600" />
          Problèmes d'authentification courants
        </h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Les tokens API peuvent expirer ou être révoqués</li>
          <li>Certaines installations d'Acelle ont des méthodes d'authentification différentes</li>
          <li>Les comptes peuvent être soumis à des restrictions IP</li>
          <li>Les autorisations peuvent être modifiées par l'administrateur</li>
          <li>Tentez de régénérer le token depuis l'interface d'administration Acelle</li>
          <li>Essayez une connexion manuelle à l'interface Acelle pour vérifier les identifiants</li>
        </ul>
      </div>
    </div>
  );
};
