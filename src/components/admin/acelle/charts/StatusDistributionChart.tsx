
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { calculateStatusCounts, translateStatus } from '@/utils/acelle/campaignStats';
import { fetchCampaignsFromCache } from '@/hooks/acelle/useCampaignFetch';

interface StatusDistributionChartProps {
  accounts: AcelleAccount[];
  demoMode?: boolean;
}

export const StatusDistributionChart: React.FC<StatusDistributionChartProps> = ({ accounts, demoMode = false }) => {
  const [campaigns, setCampaigns] = React.useState<AcelleCampaign[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Charger les campagnes depuis le cache
  React.useEffect(() => {
    const loadCampaigns = async () => {
      if (demoMode) {
        setLoading(false);
        return; // Ne pas charger les données réelles en mode démo
      }
      
      if (accounts && accounts.length > 0) {
        setLoading(true);
        try {
          // Récupérer toutes les campagnes sans pagination (skipPagination=true)
          const fetchedCampaigns = await fetchCampaignsFromCache(accounts, 1, 100, true);
          setCampaigns(fetchedCampaigns);
        } catch (error) {
          console.error("Erreur lors de la récupération des campagnes:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadCampaigns();
  }, [accounts, demoMode]);

  // Préparer les données pour le graphique
  const chartData = useMemo(() => {
    // Si mode démo, générer des données factices
    if (demoMode) {
      return [
        { status: 'Envoyé', count: 15, color: '#10b981' },
        { status: 'En envoi', count: 3, color: '#3b82f6' },
        { status: 'En attente', count: 5, color: '#f59e0b' },
        { status: 'Nouveau', count: 2, color: '#a855f7' },
        { status: 'En pause', count: 1, color: '#6b7280' },
        { status: 'Échoué', count: 2, color: '#ef4444' }
      ];
    }
    
    // Si aucune campagne ou en cours de chargement
    if (!campaigns || campaigns.length === 0) {
      return [];
    }
    
    // Calculer la distribution des statuts
    const statusCounts = calculateStatusCounts(campaigns);
    
    // Associer des couleurs aux statuts
    const statusColors: Record<string, string> = {
      "Envoyé": "#10b981",      // vert
      "En envoi": "#3b82f6",    // bleu
      "En attente": "#f59e0b",  // orange
      "Nouveau": "#a855f7",     // violet
      "En pause": "#6b7280",    // gris
      "Échoué": "#ef4444"       // rouge
    };
    
    // Ajouter la couleur à chaque élément
    return statusCounts.map(item => ({
      ...item,
      color: statusColors[item.status] || "#9ca3af"  // gris par défaut si status inconnu
    }));
  }, [campaigns, demoMode]);

  // Format personnalisé pour le tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow">
          <p className="font-medium">{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribution des statuts</CardTitle>
        <CardDescription>Répartition des campagnes par statut</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-60">
          {loading ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Chargement des données...
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="status"
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Aucune donnée disponible
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
