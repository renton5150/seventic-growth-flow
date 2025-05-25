
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Eye, RefreshCw, AlertTriangle, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AcelleCampaign, AcelleAccount, AcelleCampaignStatistics } from "@/types/acelle.types";
import { translateStatus, getStatusBadgeVariant, renderPercentage } from "@/utils/acelle/campaignStatusUtils";
import { fetchDirectStatistics, hasEmptyStatistics } from "@/services/acelle/api/stats/directStats";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface AcelleTableRowProps {
  campaign: AcelleCampaign;
  account?: AcelleAccount;
  onViewCampaign: (uid: string) => void;
}

export const AcelleTableRow = ({ 
  campaign, 
  account, 
  onViewCampaign
}: AcelleTableRowProps) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AcelleCampaignStatistics | null>(campaign?.statistics || null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'edge_function' | 'cache' | 'none'>('none');
  
  const campaignUid = campaign?.uid || campaign?.campaign_uid || '';
  const campaignName = campaign?.name || "Sans nom";
  const campaignSubject = campaign?.subject || "Sans sujet";
  const campaignStatus = (campaign?.status || "unknown").toLowerCase();
  const deliveryDate = campaign?.delivery_date || campaign?.run_at || null;

  // Récupérer les statistiques si nécessaires
  useEffect(() => {
    const loadCampaignStats = async () => {
      setLoadError(null);
      
      // Si les statistiques sont déjà présentes et complètes, ne pas recharger
      if (campaign.statistics && !hasEmptyStatistics(campaign.statistics)) {
        console.log(`[TableRow] Statistiques déjà présentes pour ${campaignName}`);
        setStats(campaign.statistics);
        setDataSource('cache');
        return;
      }
      
      if (!account || !campaignUid) {
        setLoadError(account ? "UID manquant" : "Compte non disponible");
        setDataSource('none');
        return;
      }
      
      console.log(`[TableRow] Chargement des statistiques pour ${campaignName}`);
      setIsLoading(true);
      
      try {
        // Utiliser UNIQUEMENT les Edge Functions
        const freshStats = await fetchDirectStatistics(campaignUid, account);
        
        if (freshStats && !hasEmptyStatistics(freshStats)) {
          console.log(`[TableRow] Statistiques récupérées pour ${campaignName}`);
          setStats(freshStats);
          setLoadError(null);
          setDataSource('edge_function');
        } else {
          console.log(`[TableRow] Pas de statistiques pour ${campaignName}`);
          if (campaign.statistics) {
            setStats(campaign.statistics);
            setDataSource('cache');
          } else {
            setStats(null);
            setLoadError("Stats non disponibles");
            setDataSource('none');
          }
        }
      } catch (error) {
        console.error(`[TableRow] Erreur pour ${campaignName}:`, error);
        setLoadError("Erreur Edge Function");
        setDataSource('none');
        if (campaign.statistics) {
          setStats(campaign.statistics);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCampaignStats();
  }, [campaign, account, campaignName, campaignUid]);

  // Rafraîchissement manuel
  const handleRefreshStats = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!account || isLoading || !campaignUid) return;
    
    try {
      setIsLoading(true);
      setLoadError(null);
      toast.loading(`Rafraîchissement pour ${campaignName}...`, { id: "refresh-stats" });
      
      // Utiliser UNIQUEMENT les Edge Functions
      const freshStats = await fetchDirectStatistics(campaignUid, account);
      
      if (freshStats && !hasEmptyStatistics(freshStats)) {
        setStats(freshStats);
        setDataSource('edge_function');
        toast.success(`Statistiques mises à jour`, { id: "refresh-stats" });
      } else {
        toast.error(`Échec de la mise à jour`, { id: "refresh-stats" });
        setLoadError("Échec du rafraîchissement");
        setDataSource('none');
      }
    } catch (error) {
      console.error(`Erreur rafraîchissement:`, error);
      toast.error(`Erreur lors du rafraîchissement`, { id: "refresh-stats" });
      setLoadError("Erreur de rafraîchissement");
      setDataSource('none');
    } finally {
      setIsLoading(false);
    }
  };

  // Naviguer vers la page de test
  const handleTestStatistics = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!account) {
      toast.error("Compte Acelle non disponible");
      return;
    }
    
    navigate(`/admin/acelle/campaigns/test?id=${account.id}&campaignId=${campaignUid}`);
  };

  // Formatage sécurisé des dates
  const formatDateSafely = (dateString: string | null | undefined) => {
    if (!dateString) return "Non programmé";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Date invalide";
      return format(date, "dd/MM/yyyy HH:mm", { locale: fr });
    } catch {
      return "Date invalide";
    }
  };

  // Récupérer les valeurs avec fallbacks
  const getStatValue = (value?: number | null): number => {
    return value !== undefined && value !== null ? value : 0;
  };

  // Valeurs à afficher
  const totalSent = getStatValue(stats?.subscriber_count);
  const openRate = getStatValue(stats?.uniq_open_rate || stats?.open_rate);
  const clickRate = getStatValue(stats?.click_rate);
  const bounceCount = getStatValue(stats?.bounce_count);
  
  const handleViewCampaign = () => {
    console.log(`[TableRow] Affichage des détails pour ${campaignUid}`);
    onViewCampaign(campaignUid);
  };

  // Indicateur de source des données
  const getDataSourceColor = () => {
    switch (dataSource) {
      case 'edge_function': return 'text-green-600';
      case 'cache': return 'text-orange-600';
      default: return 'text-red-600';
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex flex-col">
          <span>{campaignName}</span>
          <span className={`text-xs ${getDataSourceColor()}`}>
            {dataSource === 'edge_function' && '● API Live'}
            {dataSource === 'cache' && '● Cache'}
            {dataSource === 'none' && '● Aucune donnée'}
          </span>
        </div>
      </TableCell>
      <TableCell>{campaignSubject}</TableCell>
      <TableCell>
        <Badge variant={getStatusBadgeVariant(campaignStatus)}>
          {translateStatus(campaignStatus)}
        </Badge>
      </TableCell>
      <TableCell>{formatDateSafely(deliveryDate)}</TableCell>
      <TableCell className="font-medium tabular-nums">
        {isLoading ? "..." : totalSent.toLocaleString()}
      </TableCell>
      <TableCell className="tabular-nums">
        {isLoading ? "..." : renderPercentage(openRate)}
      </TableCell>
      <TableCell className="tabular-nums">
        {isLoading ? "..." : renderPercentage(clickRate)}
      </TableCell>
      <TableCell className="tabular-nums">
        {isLoading ? "..." : bounceCount.toLocaleString()}
      </TableCell>
      <TableCell className="text-right flex gap-1">
        <Button 
          variant={loadError ? "destructive" : "ghost"}
          size="icon"
          onClick={handleRefreshStats}
          disabled={isLoading}
          title={loadError || "Rafraîchir les statistiques"}
        >
          {loadError ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          )}
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleTestStatistics}
          title="Tester les méthodes de statistiques"
        >
          <BarChart2 className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleViewCampaign}
          title="Voir les détails"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};
