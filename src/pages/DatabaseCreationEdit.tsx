
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DatabaseCreationForm } from "@/components/requests/DatabaseCreationForm";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { getRequestById } from "@/services/requestService";
import { DatabaseRequest } from "@/types/types";
import { toast } from "sonner";
import { syncKnownMissions, preloadMissionNames } from "@/services/missionNameService";
import { formatRequestFromDb } from "@/utils/requestFormatters";
import { supabase } from "@/integrations/supabase/client";

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
        
        // Synchroniser les noms de mission connus au chargement
        console.log("DatabaseCreationEdit - Synchronisation des missions connues");
        await syncKnownMissions();
        
        // Récupérer directement la demande depuis l'API pour éviter les problèmes de cache
        const { data: rawRequest, error } = await supabase
          .from('requests')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          console.error("Erreur lors de la récupération de la demande:", error);
          toast.error("Erreur lors de la récupération de la demande");
          navigate("/dashboard");
          return;
        }
        
        if (rawRequest && rawRequest.type === "database") {
          // Utiliser le formatteur centralisé pour résoudre correctement le nom de mission
          const formattedRequest = await formatRequestFromDb(rawRequest);
          
          // Précharger le nom de la mission pour garantir qu'il est disponible
          if (formattedRequest.missionId) {
            await preloadMissionNames([formattedRequest.missionId]);
            console.log(`DatabaseCreationEdit - Mission ID: ${formattedRequest.missionId}, Nom: ${formattedRequest.missionName}`);
          }
          
          setRequest(formattedRequest as DatabaseRequest);
        } else {
          toast.error("La demande n'existe pas ou n'est pas une demande de base de données");
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de la demande:", error);
        toast.error("Erreur lors de la récupération de la demande");
      } finally {
        setLoading(false);
      }
    };

    fetchRequestDetails();
  }, [id, navigate]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p>Chargement de la demande...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Modifier la demande de base de données</h1>
        </div>
        
        {request && <DatabaseCreationForm editMode={true} initialData={request} />}
      </div>
    </AppLayout>
  );
};

export default DatabaseCreationEdit;
