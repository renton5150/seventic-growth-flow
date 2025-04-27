
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmailCampaignForm } from "@/components/requests/EmailCampaignForm";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { getRequestById } from "@/services/requestService";
import { EmailCampaignRequest } from "@/types/types";
import { toast } from "sonner";

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
        const fetchedRequest = await getRequestById(id);
        
        if (fetchedRequest && fetchedRequest.type === "email") {
          // Explicitement convertir missionId en string pour éviter les problèmes de type
          const preparedRequest = {
            ...fetchedRequest,
            missionId: fetchedRequest.missionId ? String(fetchedRequest.missionId) : "",
          };
          setRequest(preparedRequest as EmailCampaignRequest);
          
          console.log("EmailCampaignEdit - Requête récupérée:", preparedRequest);
          console.log("EmailCampaignEdit - Mission ID:", preparedRequest.missionId);
          console.log("EmailCampaignEdit - Type de mission ID:", typeof preparedRequest.missionId);
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
