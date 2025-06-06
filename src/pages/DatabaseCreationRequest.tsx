
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { DatabaseCreationForm } from "@/components/requests/DatabaseCreationForm";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { toast } from "sonner";

const DatabaseCreationRequest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Vérifier que l'utilisateur a les permissions pour créer des demandes
    if (!user) {
      toast.error("Vous devez être connecté pour créer une demande");
      navigate("/login");
      return;
    }

    const canCreateRequests = user.role === 'sdr' || user.role === 'growth' || user.role === 'admin';
    if (!canCreateRequests) {
      toast.error("Vous n'avez pas les permissions pour créer des demandes");
      navigate("/dashboard");
      return;
    }
  }, [user, navigate]);

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
