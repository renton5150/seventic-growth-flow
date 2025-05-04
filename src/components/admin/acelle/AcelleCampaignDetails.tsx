
import React, { useState, useEffect } from "react";
import { AcelleAccount } from "@/types/acelle.types";

// Hooks
import { useCampaignDetails } from "@/hooks/acelle/useCampaignDetails";
import { useSmartCampaignStats } from "@/hooks/acelle/useSmartCampaignStats";

// Components
import { CampaignLoadingState, CampaignErrorState } from "./detail/CampaignDetailStates";
import { CampaignDataControls } from "./detail/CampaignDataControls";
import { CampaignSummarySection } from "./detail/CampaignSummarySection";
import { CampaignDetailTabs } from "./detail/CampaignDetailTabs";

interface AcelleCampaignDetailsProps {
  campaignId: string;
  account: AcelleAccount;
  onClose: () => void;
  demoMode?: boolean;
}

const AcelleCampaignDetails = ({ 
  campaignId, 
  account, 
  onClose,
  demoMode = false
}: AcelleCampaignDetailsProps) => {
  const [noStatsAvailable, setNoStatsAvailable] = useState(false);
  
  // Load campaign details
  const {
    campaign,
    isLoading,
    error,
    setCampaign
  } = useCampaignDetails({ campaignId, account });
  
  // Load statistics using the smart stats hook
  const { 
    statistics, 
    isLoading: statsLoading, 
    loadStatistics,
    lastUpdated
  } = useSmartCampaignStats({
    campaign,
    account,
    autoLoad: false
  });

  // Load statistics when campaign is loaded
  useEffect(() => {
    if (campaign) {
      loadStatistics(true);
    }
  }, [campaign, loadStatistics]);

  // Update statistics when they become available
  useEffect(() => {
    if (campaign && statistics) {
      setCampaign(prev => prev ? { ...prev, statistics } : null);
      setNoStatsAvailable(false);
    } else if (campaign && !statistics) {
      setNoStatsAvailable(true);
    }
  }, [campaign, statistics, setCampaign]);

  // Handle refresh button click
  const handleRefreshStats = async () => {
    if (!campaign) return;
    
    try {
      await loadStatistics(true); // Force refresh
    } catch (err) {
      console.error("Erreur lors du rafraîchissement des statistiques:", err);
    }
  };

  // Show loading state
  if (isLoading) {
    return <CampaignLoadingState />;
  }

  // Show error state
  if (error || !campaign) {
    return <CampaignErrorState error={error} />;
  }

  return (
    <div className="space-y-6">
      {/* Data freshness info and refresh button */}
      <CampaignDataControls
        noStatsAvailable={noStatsAvailable}
        lastUpdated={lastUpdated}
        isLoading={statsLoading}
        onRefresh={handleRefreshStats}
      />
      
      {/* Campaign summary section */}
      <CampaignSummarySection
        campaign={campaign}
        noStatsAvailable={noStatsAvailable}
      />

      {/* Detailed tabs */}
      <CampaignDetailTabs
        campaign={campaign}
        noStatsAvailable={noStatsAvailable}
      />
    </div>
  );
};

export default AcelleCampaignDetails;
