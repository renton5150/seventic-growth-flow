
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase, testSupabaseConnection } from "@/integrations/supabase/client";
import { updateMission, getMissionsByUserId } from "@/services/missions-service";
import { Mission } from "@/types/types";
import { Loader2, RefreshCw, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function MissionPermissionsDebug() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [directAccessResults, setDirectAccessResults] = useState<string | null>(null);
  const [serviceAccessResults, setServiceAccessResults] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "online" | "offline">("checking");
  const [policies, setPolicies] = useState<any[]>([]);
  
  // Vérifier la connexion à Supabase
  useEffect(() => {
    const checkConnection = async () => {
      setConnectionStatus("checking");
      const isConnected = await testSupabaseConnection();
      setConnectionStatus(isConnected ? "online" : "offline");
      
      if (!isConnected) {
        toast.error("Impossible de se connecter à Supabase");
      }
    };
    
    checkConnection();
  }, []);
  
  // Récupérer les politiques RLS
  useEffect(() => {
    const fetchPolicies = async () => {
      if (connectionStatus !== "online" || !user?.id) return;
      
      try {
        // Cette requête nécessite des droits élevés mais nous la conservons pour le debug
        // Au lieu d'utiliser rpc avec get_table_policies, nous allons faire une requête SQL directe
        const { data, error } = await supabase
          .from('pg_policies')
          .select('*')
          .eq('tablename', 'missions');
        
        if (error) {
          console.warn("Impossible de récupérer les politiques RLS:", error.message);
        } else if (data) {
          setPolicies(Array.isArray(data) ? data : []);
          console.log("Politiques RLS récupérées:", data);
        }
      } catch (error) {
        console.warn("Erreur lors de la récupération des politiques RLS");
      }
    };
    
    fetchPolicies();
  }, [connectionStatus, user]);
  
  // Récupérer les missions de l'utilisateur
  useEffect(() => {
    const fetchMissions = async () => {
      if (!user || connectionStatus !== "online") return;
      
      try {
        setLoading(true);
        const userMissions = await getMissionsByUserId(user.id);
        setMissions(userMissions);
      } catch (error: any) {
        console.error("Erreur lors de la récupération des missions:", error);
        toast.error(`Erreur: ${error.message || 'Échec de chargement des missions'}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMissions();
  }, [user, connectionStatus]);
  
  // Test d'accès direct via le client Supabase
  const testDirectAccess = async (mission: Mission) => {
    try {
      setDirectAccessResults("Test en cours...");
      
      // Teste l'accès direct via Supabase client
      const testDescription = `Test modification directe: ${new Date().toISOString()}`;
      
      const { data, error } = await supabase
        .from("missions")
        .update({ description: testDescription })
        .eq("id", mission.id)
        .select()
        .single();
      
      if (error) {
        console.error("Erreur d'accès direct:", error);
        setDirectAccessResults(`Échec: ${error.message}`);
        toast.error("Échec de la modification directe", { description: error.message });
      } else {
        console.log("Réponse d'accès direct:", data);
        setDirectAccessResults(`Succès: Mission modifiée avec description "${data.description}"`);
        toast.success("Modification directe réussie");
        
        // Mettre à jour la mission dans la liste locale
        setMissions(prev => 
          prev.map(m => m.id === mission.id ? {
            ...m,
            description: data.description
          } : m)
        );
      }
    } catch (error: any) {
      console.error("Exception lors du test direct:", error);
      setDirectAccessResults(`Exception: ${error.message}`);
      toast.error(`Exception: ${error.message}`);
    }
  };
  
  // Test d'accès via le service de mission
  const testServiceAccess = async (mission: Mission) => {
    try {
      setUpdating(true);
      setServiceAccessResults("Test en cours...");
      
      // Teste l'accès via la couche de service
      const testDescription = `Test service: ${new Date().toISOString()}`;
      
      const updatedMission = await updateMission({
        id: mission.id,
        name: mission.name,
        sdrId: mission.sdrId,
        description: testDescription,
        startDate: mission.startDate,
        endDate: mission.endDate,
        type: mission.type
      });
      
      if (updatedMission) {
        console.log("Mission mise à jour via service:", updatedMission);
        setServiceAccessResults(`Succès: Mission modifiée avec description "${updatedMission.description}"`);
        toast.success("Modification via service réussie");
        
        // Mettre à jour la mission dans la liste locale
        setMissions(prev => 
          prev.map(m => m.id === mission.id ? updatedMission : m)
        );
      } else {
        setServiceAccessResults("Échec: Aucune mission retournée");
        toast.error("Échec de la modification via service");
      }
    } catch (error: any) {
      console.error("Exception lors du test service:", error);
      setServiceAccessResults(`Exception: ${error.message}`);
      toast.error(`Exception: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };
  
  // Forcer une nouvelle vérification de la connexion
  const retryConnection = async () => {
    setConnectionStatus("checking");
    const isConnected = await testSupabaseConnection();
    setConnectionStatus(isConnected ? "online" : "offline");
    
    if (isConnected) {
      toast.success("Connexion à Supabase établie");
      // Recharger les données
      if (user) {
        try {
          setLoading(true);
          const userMissions = await getMissionsByUserId(user.id);
          setMissions(userMissions);
        } catch (error: any) {
          console.error("Erreur lors de la récupération des missions:", error);
        } finally {
          setLoading(false);
        }
      }
    } else {
      toast.error("Impossible de se connecter à Supabase");
    }
  };
  
  if (!user) {
    return (
      <Card className="p-6">
        <p>Veuillez vous connecter pour tester les permissions.</p>
      </Card>
    );
  }
  
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Diagnostic de Permissions</h2>
        <div className="flex items-center gap-2">
          <Badge variant={connectionStatus === "online" ? "default" : connectionStatus === "checking" ? "outline" : "destructive"} 
                 className={connectionStatus === "online" ? "bg-green-500 hover:bg-green-600" : ""}>
            {connectionStatus === "online" ? "Connecté" : connectionStatus === "checking" ? "Vérification..." : "Déconnecté"}
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={retryConnection}
            disabled={connectionStatus === "checking"}
          >
            {connectionStatus === "checking" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Vérifier</span>
          </Button>
        </div>
      </div>
      
      <div className="mb-6 space-y-2 p-4 bg-slate-50 rounded-md">
        <div><strong>ID Utilisateur:</strong> {user.id}</div>
        <div><strong>Email:</strong> {user.email}</div>
        <div><strong>Nom:</strong> {user.name}</div>
        <div><strong>Rôle:</strong> {user.role}</div>
      </div>
      
      {connectionStatus === "offline" && (
        <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-md">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="font-semibold text-red-700">Problème de connexion à Supabase</h3>
          </div>
          <p className="mt-2 text-sm text-red-600">
            Impossible d'établir une connexion avec Supabase. Veuillez vérifier votre connexion internet
            ou si le serveur Supabase est disponible.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={retryConnection} 
            className="mt-3"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tester à nouveau la connexion
          </Button>
        </div>
      )}
      
      <h3 className="text-lg font-semibold mb-2">Missions associées ({missions.length})</h3>
      {loading ? (
        <div className="flex items-center justify-center h-24">
          <Loader2 className="h-6 w-6 text-blue-500 animate-spin mr-2" />
          <p>Chargement des missions...</p>
        </div>
      ) : missions.length === 0 ? (
        <p className="text-muted-foreground">Aucune mission trouvée pour cet utilisateur.</p>
      ) : (
        <div className="space-y-4">
          {missions.map(mission => (
            <div key={mission.id} className="border p-4 rounded-md">
              <div><strong>ID:</strong> {mission.id}</div>
              <div><strong>Nom:</strong> {mission.name}</div>
              <div><strong>Description:</strong> {mission.description || "Aucune description"}</div>
              <div><strong>SDR ID:</strong> {mission.sdrId}</div>
              <div><strong>SDR est utilisateur courant:</strong> {mission.sdrId === user.id ? "Oui" : "Non"}</div>
              <div className="mt-2 space-x-2">
                <Button 
                  onClick={() => testDirectAccess(mission)} 
                  variant="outline" 
                  size="sm"
                >
                  Tester accès direct
                </Button>
                <Button 
                  onClick={() => testServiceAccess(mission)} 
                  disabled={updating} 
                  size="sm"
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Tester via service
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {directAccessResults && (
        <div className="mt-4 p-4 border rounded-md">
          <h4 className="font-semibold flex items-center">
            Résultat du test direct:
            {directAccessResults.startsWith("Succès") ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 ml-2" />
            ) : directAccessResults.startsWith("Test") ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500 ml-2" />
            )}
          </h4>
          <p className={directAccessResults.startsWith("Succès") ? "text-green-600" : directAccessResults.startsWith("Test") ? "text-blue-600" : "text-red-600"}>
            {directAccessResults}
          </p>
        </div>
      )}
      
      {serviceAccessResults && (
        <div className="mt-4 p-4 border rounded-md">
          <h4 className="font-semibold flex items-center">
            Résultat du test via service:
            {serviceAccessResults.startsWith("Succès") ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 ml-2" />
            ) : serviceAccessResults.startsWith("Test") ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500 ml-2" />
            )}
          </h4>
          <p className={serviceAccessResults.startsWith("Succès") ? "text-green-600" : serviceAccessResults.startsWith("Test") ? "text-blue-600" : "text-red-600"}>
            {serviceAccessResults}
          </p>
        </div>
      )}
      
      {policies.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Politiques RLS actuelles</h3>
          <div className="border rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-2 text-left">Nom</th>
                    <th className="p-2 text-left">Action</th>
                    <th className="p-2 text-left">Condition</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map((policy, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2">{policy.policyname}</td>
                      <td className="p-2">{policy.permissive} {policy.cmd}</td>
                      <td className="p-2 font-mono text-xs">{policy.qual}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
