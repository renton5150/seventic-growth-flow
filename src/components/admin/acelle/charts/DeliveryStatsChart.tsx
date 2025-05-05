
import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AcelleAccount, AcelleCampaign } from '@/types/acelle.types';
import { calculateDeliveryStats } from '@/utils/acelle/campaignStats';

interface DeliveryStatsChartProps {
  accounts: AcelleAccount[];
  demoMode: boolean;
}

export const DeliveryStatsChart: React.FC<DeliveryStatsChartProps> = ({ accounts, demoMode }) => {
  // Préparer les données pour le graphique
  const chartData = useMemo(() => {
    // Limiter aux 5 dernières campagnes envoyées pour une meilleure lisibilité
    if (demoMode) {
      // Données de démonstration
      return [
        { name: "Campagne 1", delivered: 450, opened: 280, clicked: 150, bounced: 15, total: 500 },
        { name: "Campagne 2", delivered: 580, opened: 320, clicked: 180, bounced: 20, total: 600 },
        { name: "Campagne 3", delivered: 620, opened: 340, clicked: 210, bounced: 10, total: 650 },
        { name: "Campagne 4", delivered: 780, opened: 400, clicked: 250, bounced: 30, total: 800 },
        { name: "Campagne 5", delivered: 850, opened: 420, clicked: 280, bounced: 25, total: 900 }
      ];
    }
    
    // Si aucun compte actif
    if (!accounts || accounts.length === 0) {
      return [];
    }
    
    // Récupérer les campagnes de tous les comptes actifs
    const allCampaigns: AcelleCampaign[] = [];
    
    // Si pas de données ou d'erreur, retourner un tableau vide
    if (allCampaigns.length === 0) {
      console.log("Aucune campagne trouvée pour les statistiques de livraison");
      return [];
    }
    
    const stats = calculateDeliveryStats(allCampaigns);
    
    // Format pour le graphique
    return [
      {
        name: "Totaux",
        delivered: stats.totalDelivered,
        opened: stats.totalOpened,
        clicked: stats.totalClicked,
        bounced: stats.totalBounced,
        total: stats.totalEmails
      }
    ];
  }, [accounts, demoMode]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow text-sm">
          <p className="font-medium mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-green-600">Délivrés: {payload[0].value.toLocaleString()}</p>
            <p className="text-blue-600">Ouverts: {payload[1].value.toLocaleString()}</p>
            <p className="text-amber-600">Cliqués: {payload[2].value.toLocaleString()}</p>
            <p className="text-red-600">Rebonds: {payload[3].value.toLocaleString()}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performances des campagnes</CardTitle>
        <CardDescription>Statistiques des campagnes récentes</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-60">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                barSize={20}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  scale="band"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.length > 12 ? `${value.substring(0, 12)}...` : value}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="delivered" name="Délivrés" fill="#10b981" />
                <Bar dataKey="opened" name="Ouverts" fill="#3b82f6" />
                <Bar dataKey="clicked" name="Cliqués" fill="#f59e0b" />
                <Bar dataKey="bounced" name="Rebonds" fill="#ef4444" />
              </BarChart>
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
