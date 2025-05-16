
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, ShieldAlert, ShieldCheck, Lock, Key } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { checkMissionAccess, compareIds } from "@/utils/permissionUtils";
import { Mission } from "@/types/types";
import { toast } from "sonner";
import { mapSupaMissionToMission } from "@/services/missions/utils";

// Politiques RLS pour les missions (statiques pour éviter les erreurs de type)
const MISSION_POLICIES = [
  { 
    name: "Les utilisateurs peuvent voir leurs propres missions",
    definition: "Permet aux utilisateurs d'afficher uniquement les missions où ils sont SDR",
    check_expression: "auth.uid() = sdr_id"
  },
  { 
    name: "Les administrateurs peuvent voir toutes les missions",
    definition: "Permet aux administrateurs d'afficher toutes les missions",
    check_expression: "(SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'"
  },
  { 
    name: "Les utilisateurs peuvent modifier leurs propres missions",
    definition: "Permet aux utilisateurs de modifier uniquement les missions où ils sont SDR",
    check_expression: "auth.uid() = sdr_id"
  }
];

export function MissionPermissionsDebug() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [missionId, setMissionId] = useState("");
  const [missionDetails, setMissionDetails] = useState<Mission | null>(null);
  const [accessResult, setAccessResult] = useState<any>(null);
  const [policies, setPolicies] = useState(MISSION_POLICIES);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Récupérer les informations de session au chargement
  useEffect(() => {
    const getSessionInfo = async () => {
      try {
        setLoading(true);
        setConnectionError(null);
        
        // Utiliser un timeout pour éviter les blocages
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          clearTimeout(timeoutId);
          
          if (sessionError) {
            console.error("Erreur lors de la récupération de la session:", sessionError);
            setConnectionError("Impossible de récupérer la session utilisateur");
            return;
          }
          
          setSession(session);
          
          if (session?.user) {
            const { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", session.user.id)
              .single();
            
            if (profileError) {
              console.error("Erreur lors de la récupération du rôle:", profileError);
            } else {
              setUserRole(profile.role);
            }
          }
        } catch (err) {
          clearTimeout(timeoutId);
          if (err.name === 'AbortError') {
            setConnectionError("La requête a été interrompue après dépassement du délai d'attente");
          } else {
            throw err;
          }
        }
      } catch (error) {
        console.error("Erreur lors de l'initialisation:", error);
        setConnectionError(`Erreur: ${error.message || "Erreur inconnue"}`);
      } finally {
        setLoading(false);
      }
    };

    getSessionInfo();
  }, []);

  // Vérifier l'accès à une mission
  const checkAccess = async () => {
    if (!missionId) {
      toast.error("Veuillez saisir un ID de mission");
      return;
    }
    
    try {
      setChecking(true);
      
      // Récupérer les détails de la mission
      const { data: missionData, error: missionError } = await supabase
        .from("missions")
        .select("*")
        .eq("id", missionId)
        .maybeSingle();
      
      if (missionError) {
        console.error("Erreur lors de la récupération de la mission:", missionError);
        toast.error("Erreur lors de la récupération de la mission");
        return;
      }
      
      // Convertir les données Supabase au format Mission de l'application
      if (missionData) {
        const mission = await mapSupaMissionToMission(missionData);
        setMissionDetails(mission);
      } else {
        setMissionDetails(null);
      }
      
      // Vérifier l'accès
      const accessInfo = await checkMissionAccess(missionId);
      setAccessResult(accessInfo);
      
      // Si l'utilisateur est authentifié et a accès, vérifier les comparaisons d'ID
      if (session?.user && missionData) {
        const idComparison = compareIds(session.user.id, missionData.sdr_id);
        setAccessResult((prev: any) => ({
          ...prev,
          idComparison
        }));
      }
    } catch (error) {
      console.error("Erreur lors de la vérification d'accès:", error);
      toast.error("Erreur lors de la vérification d'accès");
      setAccessResult({
        authorized: false,
        reason: `Erreur: ${error.message || "Erreur inconnue"}`,
        error
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">État de la session</CardTitle>
          <CardDescription>Informations sur l'utilisateur actuel et son rôle</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : connectionError ? (
            <div className="rounded-md bg-destructive/15 p-3">
              <div className="flex items-center">
                <ShieldAlert className="h-5 w-5 text-destructive mr-2" />
                <p className="text-destructive">Erreur de connexion: {connectionError}</p>
              </div>
              <Button 
                variant="outline" 
                className="mt-2" 
                onClick={() => window.location.reload()}
              >
                Recharger la page
              </Button>
            </div>
          ) : session ? (
            <div className="space-y-4">
              <div>
                <p className="font-medium">État d'authentification:</p>
                <div className="flex items-center mt-1">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Check className="h-3 w-3 mr-1" /> Authentifié
                  </Badge>
                </div>
              </div>
              <div>
                <p className="font-medium">Utilisateur:</p>
                <p className="text-sm mt-1">{session.user.email}</p>
                <p className="text-sm text-muted-foreground">ID: {session.user.id}</p>
              </div>
              <div>
                <p className="font-medium">Rôle:</p>
                <Badge className={`mt-1 ${
                  userRole === "admin" 
                    ? "bg-purple-100 text-purple-800 hover:bg-purple-100" 
                    : userRole === "growth" 
                      ? "bg-blue-100 text-blue-800 hover:bg-blue-100" 
                      : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                }`}>
                  {userRole || "Non défini"}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="rounded-md bg-amber-50 p-3">
              <div className="flex items-center">
                <ShieldAlert className="h-5 w-5 text-amber-500 mr-2" />
                <p className="text-amber-700">Non authentifié</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Politiques RLS sur les missions</CardTitle>
          <CardDescription>Règles de sécurité au niveau des lignes pour la table missions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {policies.map((policy, index) => (
              <div key={index} className="rounded-md border p-4">
                <div className="font-medium">{policy.name}</div>
                <p className="text-sm text-muted-foreground mt-1">{policy.definition}</p>
                <p className="text-xs bg-slate-50 p-2 rounded mt-2 font-mono">
                  {policy.check_expression}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tester l'accès à une mission</CardTitle>
          <CardDescription>Vérifier si l'utilisateur actuel peut accéder à une mission spécifique</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 mb-4">
            <div className="flex-grow space-y-2">
              <label htmlFor="missionId" className="text-sm font-medium">
                ID de la mission
              </label>
              <input
                id="missionId"
                type="text"
                value={missionId}
                onChange={(e) => setMissionId(e.target.value)}
                placeholder="Entrez l'ID de la mission à tester"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <Button 
              onClick={checkAccess} 
              disabled={checking || !session || !missionId}
              className="mb-0.5"
            >
              {checking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Vérifier
            </Button>
          </div>

          {accessResult && (
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="font-medium mb-2">Résultat du test d'accès:</h3>
                <div className="p-3 rounded-md flex items-center gap-2 border">
                  {accessResult.authorized ? (
                    <>
                      <ShieldCheck className="h-5 w-5 text-green-600" />
                      <span className="text-green-700">Accès autorisé: {accessResult.reason}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-5 w-5 text-red-600" />
                      <span className="text-red-700">Accès refusé: {accessResult.reason}</span>
                    </>
                  )}
                </div>
              </div>

              {missionDetails && (
                <div>
                  <h3 className="font-medium mb-2">Détails de la mission:</h3>
                  <div className="p-3 rounded-md border space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <p className="text-sm font-medium">ID:</p>
                      <p className="text-sm">{missionDetails.id}</p>
                      
                      <p className="text-sm font-medium">Nom:</p>
                      <p className="text-sm">{missionDetails.name}</p>
                      
                      <p className="text-sm font-medium">ID du SDR:</p>
                      <p className="text-sm">{missionDetails.sdrId}</p>
                      
                      <p className="text-sm font-medium">Type:</p>
                      <p className="text-sm">{missionDetails.type}</p>
                    </div>
                  </div>
                </div>
              )}

              {accessResult.idComparison && (
                <div>
                  <h3 className="font-medium mb-2">Comparaison des IDs utilisateur/SDR:</h3>
                  <div className="p-3 rounded-md border space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={accessResult.idComparison.equal ? "outline" : "destructive"}>
                        {accessResult.idComparison.equal ? "IDs Égaux" : "IDs Différents"}
                      </Badge>
                      <span className="text-sm">
                        (User ID {accessResult.idComparison.equal ? "=" : "≠"} Mission SDR ID)
                      </span>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <p className="text-xs font-medium">ID Utilisateur:</p>
                        <p className="text-xs font-mono bg-slate-50 p-1 rounded">
                          {accessResult.idComparison.debugInfo.id1.value || "(null)"}
                        </p>
                        <p className="text-xs">
                          Type: {accessResult.idComparison.debugInfo.id1.type}
                        </p>
                        <p className="text-xs">
                          Longueur: {accessResult.idComparison.debugInfo.id1.length}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs font-medium">ID SDR Mission:</p>
                        <p className="text-xs font-mono bg-slate-50 p-1 rounded">
                          {accessResult.idComparison.debugInfo.id2.value || "(null)"}
                        </p>
                        <p className="text-xs">
                          Type: {accessResult.idComparison.debugInfo.id2.type}
                        </p>
                        <p className="text-xs">
                          Longueur: {accessResult.idComparison.debugInfo.id2.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {accessResult.debugInfo && !accessResult.idComparison && (
                <div>
                  <h3 className="font-medium mb-2">Informations de débogage:</h3>
                  <pre className="text-xs p-3 rounded-md bg-slate-50 overflow-auto max-h-40">
                    {JSON.stringify(accessResult.debugInfo, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
