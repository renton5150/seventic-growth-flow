
import React from "react";
import { BarChart } from "lucide-react";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AcelleCampaign } from "@/types/acelle.types";
import { calculateStatusCounts } from "@/utils/acelle/campaignStats";

interface CampaignStatusChartProps {
  campaigns: AcelleCampaign[];
}

export const CampaignStatusChart = ({ campaigns }: CampaignStatusChartProps) => {
  const statusCounts = calculateStatusCounts(campaigns);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart className="mr-2 h-5 w-5" />
          Statut des campagnes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {statusCounts.some(item => item.count > 0) ? (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={statusCounts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(value) => [`${value} campagne(s)`, ""]} />
              <Legend />
              <Bar dataKey="count" name="Nombre" fill="#8884d8" />
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
