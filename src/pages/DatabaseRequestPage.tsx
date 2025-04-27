
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

const DatabaseRequestPage = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Nouvelle demande de création de base</h1>
        </div>
        
        <div className="rounded-md border p-6 text-center">
          <h2 className="text-lg font-semibold mb-2">Formulaire de demande</h2>
          <p className="text-muted-foreground mb-4">
            Le formulaire de demande de base de données sera implémenté prochainement.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default DatabaseRequestPage;
