
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ArrowLeft, WarningCircle } from "lucide-react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { PageHeader } from "@/components/ui/page-header";
import { StatisticsMethodTester } from "@/components/admin/acelle/tests/StatisticsMethodTester";
import { AcelleAccount } from "@/types/acelle.types";
import { acelleService } from "@/services/acelle";

export default function CampaignStatisticsTestPage() {
  const router = useRouter();
  const { id, campaignId } = router.query;
  const [account, setAccount] = useState<AcelleAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupération du compte et vérification des paramètres
  useEffect(() => {
    const fetchAccount = async () => {
      try {
        setIsLoading(true);
        
        if (!id || !campaignId) {
          setError("Paramètres manquants: ID du compte et ID de la campagne requis");
          return;
        }

        // Récupérer le compte Acelle
        const accountData = await acelleService.accounts.getById(id as string);
        
        if (!accountData) {
          setError("Compte Acelle non trouvé");
          return;
        }
        
        setAccount(accountData);
      } catch (err) {
        console.error("Erreur lors de la récupération du compte:", err);
        setError("Erreur lors du chargement des données");
        toast.error("Erreur lors du chargement des données");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccount();
  }, [id, campaignId]);

  // Retour à la page précédente
  const handleBack = () => {
    router.back();
  };

  // Affichage pendant le chargement
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Spinner className="h-8 w-8 mr-2" />
          <p>Chargement...</p>
        </div>
      </AdminLayout>
    );
  }

  // Affichage en cas d'erreur
  if (error || !account) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-6">
          <PageHeader title="Test des méthodes de statistiques" />
          <Alert variant="destructive" className="mt-4">
            <WarningCircle className="h-5 w-5" />
            <AlertDescription>{error || "Erreur: données manquantes"}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Affichage principal
  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <PageHeader 
          title="Test des méthodes de statistiques" 
          description={`Comparaison des différentes méthodes de récupération pour le compte ${account.name}`}
        />
        
        <div className="mb-4">
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
        
        <StatisticsMethodTester 
          account={account} 
          campaignUid={campaignId as string} 
        />
      </div>
    </AdminLayout>
  );
}
