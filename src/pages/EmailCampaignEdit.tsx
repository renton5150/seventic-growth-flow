
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmailCampaignForm } from "@/components/requests/EmailCampaignForm";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { getRequestById } from "@/services/requestService";
import { EmailCampaignRequest } from "@/types/types";
import { toast } from "sonner";
import { syncKnownMissions, preloadMissionNames } from "@/services/missionNameService";
import { formatRequestFromDb } from "@/utils/requestFormatters";

const EmailCampaignEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<EmailCampaignRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Synchroniser les noms de mission connus au chargement
        await syncKnownMissions();
        
        // Récupérer directement la demande depuis l'API
        const { data: rawRequest, error } = await supabase
          .from('requests')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          toast.error("Erreur lors de la récupération de la demande");
          navigate("/dashboard");
          return;
        }
        
        if (rawRequest && rawRequest.type === "email") {
          // Utiliser le formatteur centralisé qui résout correctement les noms de mission
          const formattedRequest = await formatRequestFromDb(rawRequest);
          
          // Précharger les noms de mission pour de meilleures performances
          if (formattedRequest.missionId) {
            await preloadMissionNames([formattedRequest.missionId]);
          }
          
          // Explicitement convertir missionId en string pour éviter les problèmes de type
          const preparedRequest = {
            ...formattedRequest,
            missionId: formattedRequest.missionId ? String(formattedRequest.missionId) : "",
          };
          
          setRequest(preparedRequest as EmailCampaignRequest);
          
          console.log("EmailCampaignEdit - Requête récupérée:", preparedRequest);
          console.log("EmailCampaignEdit - Mission ID:", preparedRequest.missionId);
          console.log("EmailCampaignEdit - Mission Name:", preparedRequest.missionName);
        } else {
          toast.error("La demande n'existe pas ou n'est pas une campagne email");
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
          <h1 className="text-2xl font-bold">Modifier la campagne email</h1>
        </div>
        
        {request && <EmailCampaignForm editMode={true} initialData={request} />}
      </div>
    </AppLayout>
  );
};

export default EmailCampaignEdit;
