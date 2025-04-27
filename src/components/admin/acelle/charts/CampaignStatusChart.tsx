
import React, { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { AcelleCampaign } from "@/types/acelle.types";
import { translateStatus } from "@/utils/acelle/campaignStatusUtils";

interface CampaignStatusChartProps {
  campaigns: AcelleCampaign[];
}

// Define status colors
const STATUS_COLORS = {
  "queued": "#3498db",
  "sending": "#f39c12",
  "sent": "#2ecc71",
  "failed": "#e74c3c",
  "paused": "#95a5a6",
  "scheduled": "#9b59b6",
  "ready": "#1abc9c",
  "default": "#7f8c8d"
};

export const CampaignStatusChart: React.FC<CampaignStatusChartProps> = ({ campaigns }) => {
  const statusData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    
    // Count by status
    campaigns.forEach(campaign => {
      const status = campaign.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    // Convert to array for recharts
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: translateStatus(status),
      value: count,
      rawStatus: status
    }));
  }, [campaigns]);
  
  if (!campaigns.length) {
    return <div className="flex items-center justify-center h-full">Aucune donnée disponible</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={statusData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={(entry) => `${entry.name}: ${entry.value}`}
        >
          {statusData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={STATUS_COLORS[entry.rawStatus as keyof typeof STATUS_COLORS] || STATUS_COLORS.default} 
            />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value} campagne(s)`, 'Quantité']} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};
