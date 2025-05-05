
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { fetchCampaignsFromCache } from "@/hooks/acelle/useCampaignFetch";
import { translateStatus } from "@/utils/acelle/campaignStatusUtils";
import { Skeleton } from "@/components/ui/skeleton";

interface StatusDistributionChartProps {
  accounts: AcelleAccount[];
}

export const StatusDistributionChart: React.FC<StatusDistributionChartProps> = ({ accounts }) => {
  const [data, setData] = useState<{ status: string; count: number; color: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const COLORS = [
    "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", 
    "#82ca9d", "#ffc658", "#8dd1e1", "#a4de6c", "#d0ed57"
  ];

  useEffect(() => {
    const loadStatusDistribution = async () => {
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
        
        // Calculer la distribution des statuts
        const statusCounts: Record<string, number> = {};
        
        allCampaigns.forEach(campaign => {
          const status = campaign.status?.toLowerCase() || 'unknown';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        
        // Transformer en format pour le graphique
        const chartData = Object.entries(statusCounts)
          .filter(([_, count]) => count > 0) // Ne garder que les statuts avec des campagnes
          .map(([status, count], index) => ({
            status: translateStatus(status),
            rawStatus: status,
            count,
            color: COLORS[index % COLORS.length]
          }));
        
        setData(chartData);
      } catch (err) {
        console.error("Erreur lors du chargement des statuts des campagnes:", err);
        setError("Erreur lors du chargement des données");
      } finally {
        setIsLoading(false);
      }
    };

    loadStatusDistribution();
  }, [accounts]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribution des statuts</CardTitle>
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
          <CardTitle>Distribution des statuts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500 text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribution des statuts</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Aucune donnée disponible</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribution des statuts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="count"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string) => [`${value} campagnes`, name]} 
                labelFormatter={() => 'Statut'} 
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
