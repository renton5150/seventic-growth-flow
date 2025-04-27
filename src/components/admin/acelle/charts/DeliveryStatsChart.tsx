
import React from "react";
import { BarChart } from "lucide-react";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AcelleCampaign } from "@/types/acelle.types";
import { calculateDeliveryStats } from "@/utils/acelle/campaignStats";

interface DeliveryStatsChartProps {
  campaigns: AcelleCampaign[];
}

export const DeliveryStatsChart = ({ campaigns }: DeliveryStatsChartProps) => {
  const deliveryStats = calculateDeliveryStats(campaigns);
  
  // Format data to show both number and percentage
  const formattedStats = deliveryStats.map(stat => {
    let percentage = 0;
    if (deliveryStats[0].value > 0) {
      percentage = (stat.value / deliveryStats[0].value) * 100;
    }
    
    return {
      ...stat,
      percentage: percentage.toFixed(1)
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart className="mr-2 h-5 w-5" />
          Statistiques d'envoi
        </CardTitle>
      </CardHeader>
      <CardContent>
        {formattedStats.some(item => item.value > 0) ? (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={formattedStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip 
                formatter={(value, name, props) => {
                  if (name === "value") {
                    // Format number with percentage for tooltip
                    const percentage = props.payload.percentage;
                    return [`${value} (${percentage}%)`, ""];
                  }
                  return [value, ""];
                }}
              />
              <Legend />
              <Bar dataKey="value" name="Nombre" fill="#82ca9d" />
            </RechartsBarChart>
          </ResponsiveContainer>
        ) : (
          <div className="py-10 text-center">
            <p className="text-muted-foreground">Aucune donnée disponible</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
