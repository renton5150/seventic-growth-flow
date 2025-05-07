import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AcelleAccount } from "@/types/acelle.types";
import { fetchCampaignsFromCache } from "@/hooks/acelle/useCampaignFetch";
import { calculateDeliveryStats } from "@/utils/acelle/campaignStats";
import { Skeleton } from "@/components/ui/skeleton";
import { testCacheInsertion } from "@/services/acelle/api/stats/cacheManager";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DeliveryStatsChartProps {
  accounts: AcelleAccount[];
}

export const DeliveryStatsChart: React.FC<DeliveryStatsChartProps> = ({ accounts }) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const loadDeliveryStats = async () => {
      if (!accounts || accounts.length === 0) {
        setData([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Récupérer toutes les campagnes de tous les comptes
        const activeAccounts = accounts.filter(acc => acc.status === 'active');
        if (activeAccounts.length === 0) {
          setData([]);
          setIsLoading(false);
          return;
        }
        
        const allCampaigns = await fetchCampaignsFromCache(activeAccounts);
        
        // Calculer les statistiques de livraison
        const stats = calculateDeliveryStats(allCampaigns);
        
        // Transformer pour le graphique
        const chartData = [
          {
            name: "Statistiques",
            envoyés: stats.totalEmails,
            délivrés: stats.totalDelivered,
            ouverts: stats.totalOpened,
            cliqués: stats.totalClicked,
            bounces: stats.totalBounced
          }
        ];
        
        setData(chartData);
      } catch (err) {
        console.error("Erreur lors du chargement des statistiques de livraison:", err);
        setError("Erreur lors du chargement des données");
      } finally {
        setIsLoading(false);
      }
    };

    loadDeliveryStats();
  }, [accounts]);

  // Fonction pour tester l'insertion dans le cache
  const handleTestCache = async () => {
    if (!accounts || accounts.length === 0) {
      toast.error("Aucun compte Acelle disponible pour le test");
      return;
    }
    
    try {
      setIsTesting(true);
      toast.loading("Test d'insertion dans le cache...", { id: "cache-test" });
      
      const account = accounts[0]; // Utiliser le premier compte disponible
      const result = await testCacheInsertion(account);
      
      if (result) {
        toast.success("Test d'insertion dans le cache réussi", { id: "cache-test" });
      } else {
        toast.error("Échec du test d'insertion dans le cache", { id: "cache-test" });
      }
    } catch (error) {
      console.error("Erreur lors du test du cache:", error);
      toast.error("Erreur lors du test du cache", { id: "cache-test" });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistiques de livraison</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <Skeleton className="w-full h-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistiques de livraison</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500 text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0 || data[0].envoyés === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistiques de livraison</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-muted-foreground mb-4">Aucune donnée disponible</p>
            <Button 
              variant="outline" 
              onClick={handleTestCache}
              disabled={isTesting}
              size="sm"
            >
              Tester le cache de statistiques
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistiques de livraison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => value.toLocaleString()} />
              <Legend />
              <Bar dataKey="envoyés" fill="#8884d8" name="Envoyés" />
              <Bar dataKey="délivrés" fill="#82ca9d" name="Délivrés" />
              <Bar dataKey="ouverts" fill="#ffc658" name="Ouverts" />
              <Bar dataKey="cliqués" fill="#0088FE" name="Cliqués" />
              <Bar dataKey="bounces" fill="#FF8042" name="Bounces" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-end mt-4">
          <Button 
            variant="outline" 
            onClick={handleTestCache}
            disabled={isTesting}
            size="sm"
          >
            Tester le cache de statistiques
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
