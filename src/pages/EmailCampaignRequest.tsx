
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmailCampaignForm } from "@/components/requests/EmailCampaignForm";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const EmailCampaignRequest = () => {
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId: string }>();
  const { user, loading } = useAuth();
  const [permissionChecked, setPermissionChecked] = useState(false);

  // Déterminer si c'est une création (new) ou une édition
  const isCreationMode = requestId === "new" || !requestId;

  useEffect(() => {
    if (loading) return;

    console.log(`[EmailCampaignRequest] Mode: ${isCreationMode ? 'création' : 'édition'} - User:`, user?.role);

    if (!user) {
      console.log("[EmailCampaignRequest] Utilisateur non connecté");
      toast.error("Vous devez être connecté pour accéder à cette page");
      navigate("/login");
      return;
    }

    // Pour la création, vérifier les permissions
    if (isCreationMode) {
      const canCreateRequests = ['sdr', 'growth', 'admin'].includes(user.role || '');
      console.log("[EmailCampaignRequest] Peut créer des demandes:", canCreateRequests, "- Rôle:", user.role);

      if (!canCreateRequests) {
        console.log("[EmailCampaignRequest] Permissions insuffisantes pour le rôle:", user.role);
        toast.error(`Vous n'avez pas les permissions pour créer des demandes (rôle: ${user.role})`);
        navigate("/dashboard");
        return;
      }
    }

    console.log("[EmailCampaignRequest] Permissions OK pour le rôle:", user.role);
    setPermissionChecked(true);
  }, [user, loading, navigate, isCreationMode]);

  if (loading || !permissionChecked) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
          <h1 className="text-2xl font-bold">
            {isCreationMode ? "Nouvelle demande de campagne email" : "Modifier la demande de campagne email"}
          </h1>
        </div>
        
        <EmailCampaignForm />
      </div>
    </AppLayout>
  );
};

export default EmailCampaignRequest;
