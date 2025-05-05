
import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AcelleCampaign } from '@/types/acelle.types';

interface DeliveryStatsChartProps {
  campaigns: AcelleCampaign[];
}

export const DeliveryStatsChart: React.FC<DeliveryStatsChartProps> = ({ campaigns }) => {
  // Préparer les données pour le graphique
  const chartData = useMemo(() => {
    // Limiter aux 5 dernières campagnes envoyées pour une meilleure lisibilité
    const deliveredCampaigns = campaigns
      .filter(campaign => campaign.status === 'sent' || campaign.status === 'sending')
      .sort((a, b) => {
        const dateA = a.delivery_date ? new Date(a.delivery_date).getTime() : 0;
        const dateB = b.delivery_date ? new Date(b.delivery_date).getTime() : 0;
        return dateB - dateA; // Tri par date décroissante
      })
      .slice(0, 5);
    
    return deliveredCampaigns.map(campaign => {
      // Define default empty objects to avoid null access
      const stats = campaign.statistics || {};
      const deliveryInfo = campaign.delivery_info || {};
      
      // Helper function to safely access nested properties 
      const safelyGet = (obj: any, key: string, fallback: number = 0): number => {
        if (!obj) return fallback;
        const value = obj[key];
        return typeof value === 'number' ? value : fallback;
      };
      
      // Safely access statistics with fallbacks
      const total = safelyGet(stats, 'subscriber_count', 0) || safelyGet(deliveryInfo, 'total', 0);
      const delivered = safelyGet(stats, 'delivered_count', 0) || safelyGet(deliveryInfo, 'delivered', 0);
      const opened = safelyGet(stats, 'open_count', 0) || safelyGet(deliveryInfo, 'opened', 0);
      const clicked = safelyGet(stats, 'click_count', 0) || safelyGet(deliveryInfo, 'clicked', 0);
      
      // Handle complex types like the bounced field
      let bounced = 0;
      if (stats && typeof stats.bounce_count === 'number') {
        bounced = stats.bounce_count;
      } else if (deliveryInfo && deliveryInfo.bounced !== undefined) {
        if (typeof deliveryInfo.bounced === 'object' && deliveryInfo.bounced !== null) {
          bounced = safelyGet(deliveryInfo.bounced, 'total', 0);
        } else if (typeof deliveryInfo.bounced === 'number') {
          bounced = deliveryInfo.bounced;
        }
      }
      
      return {
        name: campaign.name.length > 20 ? campaign.name.substring(0, 20) + '...' : campaign.name,
        delivered,
        opened,
        clicked,
        bounced,
        total
      };
    }).reverse(); // Inverser pour avoir l'ordre chronologique
  }, [campaigns]);

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
        </div>
      </CardContent>
    </Card>
  );
};
