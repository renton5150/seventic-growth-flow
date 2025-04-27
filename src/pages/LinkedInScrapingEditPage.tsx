
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

const LinkedInScrapingEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Modifier la demande de scraping LinkedIn</h1>
        </div>
        
        <div className="rounded-md border p-6 text-center">
          <h2 className="text-lg font-semibold mb-2">Formulaire d'édition</h2>
          <p className="text-muted-foreground mb-4">
            Édition de la demande ID: {id}
          </p>
          <p className="text-muted-foreground">
            La fonctionnalité d'édition sera implémentée prochainement.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default LinkedInScrapingEditPage;
