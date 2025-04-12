
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { updateMission, getMissionsByUserId } from "@/services/missions-service";
import { Mission } from "@/types/types";

export function MissionPermissionsDebug() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [directAccessResults, setDirectAccessResults] = useState<string | null>(null);
  const [serviceAccessResults, setServiceAccessResults] = useState<string | null>(null);
  
  // Récupérer les missions de l'utilisateur
  useEffect(() => {
    const fetchMissions = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const userMissions = await getMissionsByUserId(user.id);
        setMissions(userMissions);
      } catch (error) {
        console.error("Erreur lors de la récupération des missions:", error);
        toast.error("Erreur lors de la récupération des missions");
      } finally {
        setLoading(false);
      }
    };
    
    fetchMissions();
  }, [user]);
  
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
        toast.error("Échec de la modification directe");
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
  
  if (!user) {
    return (
      <Card className="p-6">
        <p>Veuillez vous connecter pour tester les permissions.</p>
      </Card>
    );
  }
  
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Diagnostic de Permissions</h2>
      
      <div className="mb-6 space-y-2">
        <div><strong>ID Utilisateur:</strong> {user.id}</div>
        <div><strong>Email:</strong> {user.email}</div>
        <div><strong>Nom:</strong> {user.name}</div>
        <div><strong>Rôle:</strong> {user.role}</div>
      </div>
      
      <h3 className="text-lg font-semibold mb-2">Missions associées ({missions.length})</h3>
      {loading ? (
        <p>Chargement des missions...</p>
      ) : missions.length === 0 ? (
        <p>Aucune mission trouvée pour cet utilisateur.</p>
      ) : (
        <div className="space-y-4">
          {missions.map(mission => (
            <div key={mission.id} className="border p-4 rounded-md">
              <div><strong>ID:</strong> {mission.id}</div>
              <div><strong>Nom:</strong> {mission.name}</div>
              <div><strong>Description:</strong> {mission.description || "Aucune description"}</div>
              <div><strong>SDR ID:</strong> {mission.sdrId}</div>
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
                  Tester via service
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {directAccessResults && (
        <div className="mt-4 p-4 border rounded-md">
          <h4 className="font-semibold">Résultat du test direct:</h4>
          <p className={directAccessResults.startsWith("Succès") ? "text-green-600" : "text-red-600"}>
            {directAccessResults}
          </p>
        </div>
      )}
      
      {serviceAccessResults && (
        <div className="mt-4 p-4 border rounded-md">
          <h4 className="font-semibold">Résultat du test via service:</h4>
          <p className={serviceAccessResults.startsWith("Succès") ? "text-green-600" : "text-red-600"}>
            {serviceAccessResults}
          </p>
        </div>
      )}
    </Card>
  );
}
