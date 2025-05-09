
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AcelleCampaign, AcelleCampaignStatistics } from "@/types/acelle.types";
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
  // Fonction pour extraire une valeur numérique sécurisée
  const getNumericValue = (value: any): number => {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };
  
  // Calcul des statistiques agrégées avec log des valeurs pour déboguer
  const calculateStats = () => {
    let totalRecipients = 0;
    let totalDelivered = 0;
    let totalOpens = 0;
    let totalClicks = 0;
    let totalBounces = 0;
    
    campaigns.forEach((campaign, index) => {
      console.log(`[CampaignSummaryStats] Stats for campaign ${index} (${campaign.name}):`, {
        statistics: campaign.statistics,
        delivery_info: campaign.delivery_info
      });
      
      // Essayer d'obtenir les valeurs depuis les statistiques d'abord, puis depuis delivery_info
      const stats = campaign.statistics || {};
      const deliveryInfo = campaign.delivery_info || {};
      
      // Utiliser des variables temporaires typées pour éviter les erreurs TypeScript
      const statsTyped = stats as Partial<AcelleCampaignStatistics>;
      const deliveryInfoTyped = deliveryInfo as Record<string, any>;
      
      // Nombre total de destinataires
      const recipients = getNumericValue(statsTyped.subscriber_count) || 
                        getNumericValue(deliveryInfoTyped.total) || 0;
      totalRecipients += recipients;
      
      // Nombre d'emails délivrés
      const delivered = getNumericValue(statsTyped.delivered_count) || 
                       getNumericValue(deliveryInfoTyped.delivered) || 0;
      totalDelivered += delivered;
      
      // Nombre d'ouvertures
      const opens = getNumericValue(statsTyped.open_count) || 
                   getNumericValue(deliveryInfoTyped.opened) || 0;
      totalOpens += opens;
      
      // Nombre de clics
      const clicks = getNumericValue(statsTyped.click_count) || 
                    getNumericValue(deliveryInfoTyped.clicked) || 0;
      totalClicks += clicks;
      
      // Nombre de rebonds
      let bounces = 0;
      
      // Traitement spécial pour les rebonds qui peuvent être un objet ou un nombre
      if (statsTyped.bounce_count !== undefined) {
        bounces = getNumericValue(statsTyped.bounce_count);
      } else if (deliveryInfoTyped.bounced !== undefined) {
        if (typeof deliveryInfoTyped.bounced === 'object' && deliveryInfoTyped.bounced !== null) {
          bounces = getNumericValue((deliveryInfoTyped.bounced as any).total);
        } else {
          bounces = getNumericValue(deliveryInfoTyped.bounced);
        }
      }
      
      totalBounces += bounces;
      
      console.log(`[CampaignSummaryStats] Extracted values for campaign ${index}:`, { 
        recipients, delivered, opens, clicks, bounces 
      });
    });
    
    // Calculer les taux
    const avgOpenRate = totalDelivered > 0 
      ? Math.round((totalOpens / totalDelivered) * 100) 
      : 0;

    const avgClickRate = totalOpens > 0 
      ? Math.round((totalClicks / totalOpens) * 100) 
      : 0;
      
    const bounceRate = totalRecipients > 0
      ? Math.round((totalBounces / totalRecipients) * 100) 
      : 0;
    
    console.log('[CampaignSummaryStats] Final aggregated stats:', { 
      totalRecipients, totalDelivered, totalOpens, totalClicks, totalBounces,
      avgOpenRate, avgClickRate, bounceRate
    });
    
    return {
      totalRecipients,
      totalDelivered,
      totalOpens,
      totalClicks,
      totalBounces,
      avgOpenRate,
      avgClickRate,
      bounceRate
    };
  };
  
  // Calculer les statistiques
  const {
    totalRecipients,
    totalDelivered,
    totalOpens,
    totalClicks,
    totalBounces,
    avgOpenRate,
    avgClickRate,
    bounceRate
  } = calculateStats();

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
