
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
  // État local pour les statistiques
  const [stats, setStats] = useState<AcelleCampaignStatistics | null>(campaign?.statistics || null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Garantir la présence d'un UID valide
  const campaignUid = campaign?.uid || campaign?.campaign_uid || '';
  
  // Garantir des valeurs sûres pour les propriétés obligatoires
  const campaignName = campaign?.name || "Sans nom";
  const campaignSubject = campaign?.subject || "Sans sujet";
  const campaignStatus = (campaign?.status || "unknown").toLowerCase();
  
  // Date d'envoi avec fallback
  const deliveryDate = campaign?.delivery_date || campaign?.run_at || null;

  // Récupérer les statistiques de la campagne via Edge Functions uniquement
  useEffect(() => {
    const loadCampaignStats = async () => {
      // Réinitialiser l'état d'erreur
      setLoadError(null);
      
      // Si les statistiques sont déjà présentes avec des valeurs non-nulles, ne pas recharger
      if (campaign.statistics && !hasEmptyStatistics(campaign.statistics) && !campaign.meta?.force_refresh) {
        console.log(`[TableRow] Statistiques déjà présentes pour la campagne ${campaignName}`, campaign.statistics);
        setStats(campaign.statistics);
        return;
      }
      
      console.log(`[TableRow] Récupération des statistiques pour la campagne ${campaignName}`);
      
      if (!account) {
        console.warn(`[TableRow] Pas de compte disponible pour récupérer les statistiques de ${campaignName}`);
        setLoadError("Compte non disponible");
        return;
      }
      
      if (!campaignUid) {
        console.warn(`[TableRow] Pas d'UID pour la campagne ${campaignName}`);
        setLoadError("UID de campagne manquant");
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Récupérer les statistiques via Edge Functions uniquement
        const freshStats = await fetchDirectStatistics(campaignUid, account);
        
        if (freshStats && !hasEmptyStatistics(freshStats)) {
          console.log(`[TableRow] Statistiques récupérées pour ${campaignName}`, freshStats);
          setStats(freshStats);
          setLoadError(null);
        } else {
          console.log(`[TableRow] Pas de statistiques disponibles pour ${campaignName}`);
          // Utiliser les statistiques existantes si disponibles
          if (campaign.statistics && !hasEmptyStatistics(campaign.statistics)) {
            setStats(campaign.statistics);
          } else {
            setStats(null);
            setLoadError("Aucune statistique disponible");
          }
        }
      } catch (error) {
        console.error(`[TableRow] Erreur lors de la récupération des statistiques pour ${campaignName}:`, error);
        setLoadError("Erreur de récupération");
        // Conserver les statistiques existantes en cas d'erreur
        if (campaign.statistics) {
          setStats(campaign.statistics);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCampaignStats();
  }, [campaign, account, campaignName, campaignUid]);

  // Fonction pour forcer le rafraîchissement des statistiques
  const handleRefreshStats = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Éviter de déclencher l'événement sur la ligne
    
    if (!account || isLoading) return;
    
    try {
      setIsLoading(true);
      setLoadError(null);
      toast.loading(`Rafraîchissement des statistiques pour ${campaignName}...`, { id: "refresh-stats" });
      
      const freshStats = await fetchDirectStatistics(campaignUid, account);
      
      if (freshStats && !hasEmptyStatistics(freshStats)) {
        setStats(freshStats);
        toast.success(`Statistiques mises à jour pour ${campaignName}`, { id: "refresh-stats" });
      } else {
        toast.error(`Échec de la mise à jour des statistiques pour ${campaignName}`, { id: "refresh-stats" });
        setLoadError("Échec du rafraîchissement");
      }
    } catch (error) {
      console.error(`Erreur lors du rafraîchissement des statistiques:`, error);
      toast.error(`Erreur lors du rafraîchissement des statistiques`, { id: "refresh-stats" });
      setLoadError("Erreur de rafraîchissement");
    } finally {
      setIsLoading(false);
    }
  };

  // Naviguer vers la page de test des statistiques
  const handleTestStatistics = (e: React.MouseEvent) => {
    e.stopPropagation(); // Éviter de déclencher l'événement sur la ligne
    
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

  // Récupérer les valeurs avec fallbacks pour les statistiques
  const getStatValue = (value?: number | null): number => {
    return value !== undefined && value !== null ? value : 0;
  };

  // Valeurs à afficher avec fallbacks sécurisés
  const totalSent = getStatValue(stats?.subscriber_count);
  const openRate = getStatValue(stats?.uniq_open_rate || stats?.open_rate);
  const clickRate = getStatValue(stats?.click_rate);
  const bounceCount = getStatValue(stats?.bounce_count);
  
  const handleViewCampaign = () => {
    console.log(`[TableRow] Affichage des détails pour la campagne ${campaignUid}`, { campaign });
    onViewCampaign(campaignUid);
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{campaignName}</TableCell>
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
