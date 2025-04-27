
import React, { useMemo } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { AcelleCampaign } from "@/types/acelle.types";
import { safeDeliveryInfo } from "@/utils/acelle/campaignStatusUtils";

interface DeliveryStatsChartProps {
  campaigns: AcelleCampaign[];
}

export const DeliveryStatsChart: React.FC<DeliveryStatsChartProps> = ({ campaigns }) => {
  // Aggregate and prepare data for the chart
  const chartData = useMemo(() => {
    // Take the 10 most recent campaigns
    const recentCampaigns = [...campaigns]
      .sort((a, b) => {
        const dateA = new Date(a.delivery_date || a.created_at || 0).getTime();
        const dateB = new Date(b.delivery_date || b.created_at || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 10);
    
    return recentCampaigns.map(campaign => {
      // Use the safe helper to get delivery info with default values
      const deliveryInfo = safeDeliveryInfo(campaign);
      
      // All properties are now safely accessible
      const total = deliveryInfo.total;
      const deliveryRate = deliveryInfo.delivery_rate;
      const openRate = deliveryInfo.unique_open_rate;
      const clickRate = deliveryInfo.click_rate;
      
      return {
        name: campaign.name.length > 15 ? `${campaign.name.substring(0, 15)}...` : campaign.name,
        fullName: campaign.name,
        "Taux d'envoi": Math.round(deliveryRate * 100),
        "Taux d'ouverture": Math.round(openRate * 100),
        "Taux de clic": Math.round(clickRate * 100)
      };
    }).reverse(); // Reverse to show in chronological order
  }, [campaigns]);

  if (!campaigns.length) {
    return <div className="flex items-center justify-center h-full">Aucune donnée disponible</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          angle={-45} 
          textAnchor="end"
          height={70}
          interval={0}
        />
        <YAxis unit="%" />
        <Tooltip 
          formatter={(value, name) => [`${value}%`, name]}
          labelFormatter={(label, payload) => {
            if (payload && payload.length > 0 && payload[0].payload) {
              return payload[0].payload.fullName;
            }
            return label;
          }}
        />
        <Legend />
        <Bar dataKey="Taux d'envoi" fill="#8884d8" />
        <Bar dataKey="Taux d'ouverture" fill="#82ca9d" />
        <Bar dataKey="Taux de clic" fill="#ffc658" />
      </BarChart>
    </ResponsiveContainer>
  );
};
