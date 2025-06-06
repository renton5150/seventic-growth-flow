
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { DatabaseCreationForm } from "@/components/requests/DatabaseCreationForm";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const DatabaseCreationRequest = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [permissionChecked, setPermissionChecked] = useState(false);

  useEffect(() => {
    // Attendre que l'utilisateur soit chargé
    if (loading) return;

    console.log("[DatabaseCreationRequest] Vérification des permissions - User:", user?.role);

    // Vérifier que l'utilisateur est connecté
    if (!user) {
      console.log("[DatabaseCreationRequest] Utilisateur non connecté");
      toast.error("Vous devez être connecté pour créer une demande");
      navigate("/login");
      return;
    }

    // Vérifier les permissions pour créer des demandes
    const canCreateRequests = user.role === 'sdr' || user.role === 'growth' || user.role === 'admin';
    console.log("[DatabaseCreationRequest] Peut créer des demandes:", canCreateRequests, "- Rôle:", user.role);

    if (!canCreateRequests) {
      console.log("[DatabaseCreationRequest] Permissions insuffisantes");
      toast.error("Vous n'avez pas les permissions pour créer des demandes");
      navigate("/dashboard");
      return;
    }

    console.log("[DatabaseCreationRequest] Permissions OK");
    setPermissionChecked(true);
  }, [user, loading, navigate]);

  // Afficher un loader pendant la vérification
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
          <h1 className="text-2xl font-bold">Nouvelle demande de création de base</h1>
        </div>
        
        <DatabaseCreationForm />
      </div>
    </AppLayout>
  );
};

export default DatabaseCreationRequest;
