
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DatabaseCreationForm } from "@/components/requests/DatabaseCreationForm";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { getRequestById } from "@/services/requestService";
import { DatabaseRequest } from "@/types/types";
import { toast } from "sonner";

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
        const fetchedRequest = await getRequestById(id);
        
        if (fetchedRequest && fetchedRequest.type === "database") {
          setRequest(fetchedRequest as DatabaseRequest);
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
