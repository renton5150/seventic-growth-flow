
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { calculateStatusCounts } from '@/utils/acelle/campaignStats';

interface StatusDistributionChartProps {
  accounts: AcelleAccount[];
  demoMode: boolean;
}

export const StatusDistributionChart: React.FC<StatusDistributionChartProps> = ({ accounts, demoMode }) => {
  // Préparer les données pour le graphique
  const chartData = useMemo(() => {
    // Si aucun compte actif
    if (!accounts || accounts.length === 0) {
      return [];
    }

    // Récupérer les campagnes de tous les comptes actifs
    let allCampaigns: AcelleCampaign[] = [];
    
    // Si mode démo, générer des données factices
    if (demoMode) {
      // Données de démo
      return [
        { status: 'Envoyé', count: 15, color: '#10b981' },
        { status: 'En envoi', count: 3, color: '#3b82f6' },
        { status: 'En attente', count: 5, color: '#f59e0b' },
        { status: 'Nouveau', count: 2, color: '#a855f7' },
        { status: 'En pause', count: 1, color: '#6b7280' },
        { status: 'Échoué', count: 2, color: '#ef4444' }
      ];
    }
    
    // Si pas de données réelles ou d'erreur, retourner un tableau vide
    if (allCampaigns.length === 0) {
      console.log("Aucune campagne trouvée pour la distribution des statuts");
      return [];
    }
    
    // Calculer la distribution des statuts
    const statusCounts = calculateStatusCounts(allCampaigns);
    
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
  }, [accounts, demoMode]);

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
          {chartData.length > 0 ? (
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
