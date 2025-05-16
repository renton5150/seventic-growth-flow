
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DatabaseCreationForm } from "@/components/requests/DatabaseCreationForm";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { DatabaseRequest } from "@/types/types";
import { toast } from "sonner";
import { syncKnownMissions, preloadMissionNames, forceRefreshFreshworks, getMissionNameCache } from "@/services/missionNameService";
import { formatRequestFromDb } from "@/utils/requestFormatters";
import { supabase } from "@/integrations/supabase/client";

// ID Constant de Freshworks pour vérification directe
const FRESHWORKS_ID = "57763c8d-71b6-4e2d-9adf-94d8abbb4d2b";

const DatabaseCreationEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<DatabaseRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // ÉTAPE 1: Initialiser le cache de noms de mission AVANT toute requête
        console.log("DatabaseCreationEdit - Initialisation du cache de missions");
        
        // Forcer le rafraîchissement de Freshworks avant tout
        forceRefreshFreshworks();
        console.log("DatabaseCreationEdit - Cache Freshworks forcé");
        
        // Puis synchroniser toutes les missions connues
        await syncKnownMissions();
        console.log("DatabaseCreationEdit - Missions connues synchronisées");
        
        // Vérification du cache après initialisation
        const initialCache = getMissionNameCache();
        console.log("DatabaseCreationEdit - Cache de missions initialisé:", initialCache);
        
        // ÉTAPE 2: Récupérer la requête depuis Supabase
        console.log(`DatabaseCreationEdit - Récupération de la demande ${id}`);
        const { data: rawRequest, error } = await supabase
          .from('requests_with_missions')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          console.error("DatabaseCreationEdit - Erreur de requête Supabase:", error);
          toast.error("Erreur lors de la récupération de la demande");
          navigate("/dashboard");
          return;
        }
        
        if (rawRequest && rawRequest.type === "database") {
          console.log("DatabaseCreationEdit - Requête database récupérée:", rawRequest);
          
          // ÉTAPE 3: Vérification spéciale pour Freshworks
          const isFreshworks = rawRequest.mission_id === FRESHWORKS_ID;
          if (isFreshworks) {
            console.log("DatabaseCreationEdit - Mission Freshworks détectée - traitement spécial");
            // Assurer que Freshworks est correctement dans le cache
            forceRefreshFreshworks();
            
            // Pour Freshworks, créer directement l'objet pour garantir le nom correct
            const freshworksRequest: DatabaseRequest = {
              id: rawRequest.id,
              title: rawRequest.title,
              type: rawRequest.type,
              status: rawRequest.status as any,
              createdBy: rawRequest.created_by,
              missionId: FRESHWORKS_ID,
              missionName: "Freshworks", // Force le nom
              sdrName: rawRequest.sdr_name,
              assignedToName: rawRequest.assigned_to_name,
              dueDate: rawRequest.due_date,
              details: rawRequest.details || {},
              workflow_status: rawRequest.workflow_status as any,
              assigned_to: rawRequest.assigned_to,
              isLate: false, // Calculé plus tard
              createdAt: new Date(rawRequest.created_at),
              lastUpdated: new Date(rawRequest.last_updated || rawRequest.updated_at),
              target_role: rawRequest.target_role,
              tool: rawRequest.details?.tool || "Hubspot",
              targeting: rawRequest.details?.targeting || {},
              blacklist: rawRequest.details?.blacklist || {}
            };
            
            console.log("DatabaseCreationEdit - Requête Freshworks préparée:", freshworksRequest);
            setRequest(freshworksRequest);
          } else {
            // Pour les autres missions, utiliser le formatteur standard
            console.log("DatabaseCreationEdit - Formatage standard pour mission non-Freshworks");
            
            // Précharger le nom de la mission
            if (rawRequest.mission_id) {
              await preloadMissionNames([rawRequest.mission_id]);
            }
            
            // Utiliser le formatteur pour résoudre correctement le nom
            const formattedRequest = await formatRequestFromDb(rawRequest);
            console.log("DatabaseCreationEdit - Requête formatée:", formattedRequest);
            
            setRequest(formattedRequest as DatabaseRequest);
          }
        } else {
          console.error("DatabaseCreationEdit - Type de requête invalide ou non trouvé");
          toast.error("La demande n'existe pas ou n'est pas une demande de base de données");
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("DatabaseCreationEdit - Erreur inattendue:", error);
        toast.error("Erreur lors de la récupération de la demande");
      } finally {
        setLoading(false);
      }
    };

    fetchRequestDetails();
  }, [id, navigate]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Modifier la demande de base de données</h1>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
            <p>Chargement des données de la demande...</p>
          </div>
        ) : request ? (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
              <p className="text-blue-800 font-medium">Mission: <span className="font-bold">{request.missionName || "Sans mission"}</span></p>
              {request.missionId === FRESHWORKS_ID && (
                <p className="text-xs text-blue-600 mt-1">Mission Freshworks confirmée</p>
              )}
            </div>
            <DatabaseCreationForm editMode={true} initialData={request} />
          </>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">Impossible de charger les détails de la demande</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default DatabaseCreationEdit;
