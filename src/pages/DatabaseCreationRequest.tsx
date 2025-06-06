
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { DatabaseCreationForm } from "@/components/requests/DatabaseCreationForm";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const DatabaseCreationRequest = () => {
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId: string }>();
  const { user, loading } = useAuth();
  const [permissionChecked, setPermissionChecked] = useState(false);

  // Déterminer si c'est une création (new) ou une édition
  const isCreationMode = requestId === "new" || !requestId;

  useEffect(() => {
    if (loading) return;

    console.log(`[DatabaseCreationRequest] Mode: ${isCreationMode ? 'création' : 'édition'} - User:`, user?.role);

    if (!user) {
      console.log("[DatabaseCreationRequest] Utilisateur non connecté");
      toast.error("Vous devez être connecté pour accéder à cette page");
      navigate("/login");
      return;
    }

    // Pour la création, vérifier les permissions
    if (isCreationMode) {
      const canCreateRequests = ['sdr', 'growth', 'admin'].includes(user.role || '');
      console.log("[DatabaseCreationRequest] Peut créer des demandes:", canCreateRequests, "- Rôle:", user.role);

      if (!canCreateRequests) {
        console.log("[DatabaseCreationRequest] Permissions insuffisantes pour le rôle:", user.role);
        toast.error(`Vous n'avez pas les permissions pour créer des demandes (rôle: ${user.role})`);
        navigate("/dashboard");
        return;
      }
    }

    console.log("[DatabaseCreationRequest] Permissions OK pour le rôle:", user.role);
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
            {isCreationMode ? "Nouvelle demande de création de base" : "Modifier la demande de création de base"}
          </h1>
        </div>
        
        <DatabaseCreationForm />
      </div>
    </AppLayout>
  );
};

export default DatabaseCreationRequest;
