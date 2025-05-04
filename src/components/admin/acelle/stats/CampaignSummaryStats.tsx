
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AcelleCampaign } from "@/types/acelle.types";
import { 
  Users, Send, EyeIcon, MousePointerClick, AlertTriangle
} from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
}

const StatsCard = ({ title, value, description, icon, trend }: StatsCardProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline mt-2">
              <h3 className="text-2xl font-bold">{value}</h3>
              {trend && (
                <p className={`ml-2 text-xs ${trend.value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className="p-2 bg-primary/10 rounded-full">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface CampaignSummaryStatsProps {
  campaigns: AcelleCampaign[];
}

export const CampaignSummaryStats: React.FC<CampaignSummaryStatsProps> = ({ campaigns }) => {
  // Calculate aggregated statistics
  const totalRecipients = campaigns.reduce(
    (sum, campaign) => sum + (campaign.statistics?.subscriber_count || 0), 
    0
  );
  
  const totalDelivered = campaigns.reduce(
    (sum, campaign) => sum + (campaign.statistics?.delivered_count || 0),
    0
  );
  
  const totalOpens = campaigns.reduce(
    (sum, campaign) => sum + (campaign.statistics?.open_count || 0),
    0
  );
  
  const totalClicks = campaigns.reduce(
    (sum, campaign) => sum + (campaign.statistics?.click_count || 0),
    0
  );
  
  const totalBounces = campaigns.reduce(
    (sum, campaign) => sum + (campaign.statistics?.bounce_count || 0),
    0
  );

  const avgOpenRate = totalDelivered > 0 
    ? Math.round((totalOpens / totalDelivered) * 100) 
    : 0;

  const avgClickRate = totalOpens > 0 
    ? Math.round((totalClicks / totalOpens) * 100) 
    : 0;
    
  const bounceRate = totalRecipients > 0
    ? Math.round((totalBounces / totalRecipients) * 100) 
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Destinataires"
        value={totalRecipients.toLocaleString()}
        description="Total des destinataires"
        icon={<Users className="h-5 w-5 text-primary" />}
        trend={{ value: 0, label: "ce mois" }} // Exemple fixe
      />
      <StatsCard
        title="Taux d'ouverture"
        value={`${avgOpenRate}%`}
        description={`${totalOpens.toLocaleString()} ouvertures`}
        icon={<EyeIcon className="h-5 w-5 text-blue-500" />}
        trend={{ value: 2.5, label: "vs. moyenne" }} // Exemple fixe
      />
      <StatsCard
        title="Taux de clic"
        value={`${avgClickRate}%`}
        description={`${totalClicks.toLocaleString()} clics`}
        icon={<MousePointerClick className="h-5 w-5 text-amber-500" />}
        trend={{ value: 1.2, label: "vs. moyenne" }} // Exemple fixe
      />
      <StatsCard
        title="Taux de rebond"
        value={`${bounceRate}%`}
        description={`${totalBounces.toLocaleString()} rebonds`}
        icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
        trend={{ value: -0.8, label: "vs. moyenne" }} // Exemple fixe
      />
    </div>
  );
};
