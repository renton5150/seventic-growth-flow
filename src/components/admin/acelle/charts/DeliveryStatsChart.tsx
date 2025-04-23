
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart className="mr-2 h-5 w-5" />
          Statistiques d'envoi
        </CardTitle>
      </CardHeader>
      <CardContent>
        {deliveryStats.some(item => item.value > 0) ? (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={deliveryStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(value) => [`${value}`, ""]} />
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
