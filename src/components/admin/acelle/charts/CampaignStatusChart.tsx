
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, ResponsiveContainer, Cell, Legend, Tooltip } from 'recharts';
import { AcelleCampaign } from '@/types/acelle.types';

interface CampaignStatusChartProps {
  campaigns: AcelleCampaign[];
}

export const CampaignStatusChart: React.FC<CampaignStatusChartProps> = ({ campaigns }) => {
  // Traduire les status pour l'affichage
  const translateStatus = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'sent': return 'Envoyée';
      case 'sending': return 'En cours';
      case 'queued': return 'En file';
      case 'ready': return 'Prête';
      case 'new': return 'Nouvelle';
      case 'paused': return 'En pause';
      case 'failed': return 'Échec';
      case 'draft': return 'Brouillon';
      default: return status;
    }
  };

  // Compter les campagnes par statut
  const statusCounts: Record<string, number> = {};
  campaigns.forEach(campaign => {
    const status = campaign.status.toLowerCase();
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  // Préparer les données pour le graphique
  const chartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: translateStatus(status),
    value: count,
    status
  }));

  // Couleurs en fonction du statut
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'sent': return '#10b981'; // green-500
      case 'sending': return '#3b82f6'; // blue-500
      case 'queued': return '#f59e0b'; // amber-500
      case 'ready': return '#8b5cf6'; // violet-500
      case 'new': return '#6b7280'; // gray-500
      case 'paused': return '#6b7280'; // gray-500
      case 'failed': return '#ef4444'; // red-500
      case 'draft': return '#9ca3af'; // gray-400
      default: return '#d1d5db'; // gray-300
    }
  };

  // Personnaliser le tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow text-sm">
          <p className="font-medium">{payload[0].name}</p>
          <p>Campagnes: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  // Triez les données pour avoir une meilleure présentation
  const sortedChartData = [...chartData].sort((a, b) => b.value - a.value);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statut des campagnes</CardTitle>
        <CardDescription>Distribution des campagnes par statut</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sortedChartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {sortedChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-2">
          {sortedChartData.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: getStatusColor(entry.status) }} />
              <span className="text-sm text-muted-foreground">{entry.name}: {entry.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
