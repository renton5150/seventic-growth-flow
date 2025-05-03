
import { useEffect, useState } from "react";
import { AcelleCampaign, AcelleAccount } from "@/types/acelle.types";
import { fetchAndProcessCampaignStats } from "@/services/acelle/api/campaignStats";
import { refreshStatsCacheForCampaigns, extractQuickStats } from "@/services/acelle/api/optimizedStats";
import { toast } from "sonner";

interface AcelleTableBatchLoaderProps {
  campaigns: AcelleCampaign[];
  account?: AcelleAccount;
  demoMode?: boolean;
  onBatchLoaded?: (updatedCampaigns: AcelleCampaign[]) => void;
}

export const AcelleTableBatchLoader = ({ 
  campaigns, 
  account,
  demoMode = false,
  onBatchLoaded
}: AcelleTableBatchLoaderProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Function to load statistics in batches
    const loadBatchStatistics = async () => {
      if (!campaigns || campaigns.length === 0) return;
      
      console.log(`Starting batch loading of statistics for ${campaigns.length} campaigns`);
      setIsLoading(true);
      toast.loading("Chargement des statistiques de campagnes...", { id: "batch-stats-loading" });
      
      try {
        // Create a deep copy of campaigns to avoid mutating props
        const updatedCampaigns = JSON.parse(JSON.stringify(campaigns)) as AcelleCampaign[];
        
        // Get all campaign UIDs
        const campaignUids = updatedCampaigns
          .filter(c => c.uid || c.campaign_uid)
          .map(c => c.uid || c.campaign_uid || '');
        
        if (campaignUids.length === 0) {
          console.log("No valid campaign UIDs found");
          toast.error("Aucun identifiant de campagne valide trouvé", { id: "batch-stats-loading" });
          return;
        }
        
        // For demo mode, just use existing statistics or create them
        if (demoMode) {
          // Ensure each campaign has statistics
          updatedCampaigns.forEach(campaign => {
            if (!campaign.statistics) {
              campaign.statistics = extractQuickStats(campaign);
            }
          });
          
          console.log("Demo mode: statistics ready for display");
          if (onBatchLoaded) onBatchLoaded(updatedCampaigns);
          toast.success("Statistiques démo chargées", { id: "batch-stats-loading" });
          return;
        }
        
        // First refresh the cache for all UIDs
        console.log("Refreshing statistics cache for all campaigns");
        await refreshStatsCacheForCampaigns(campaignUids);
        
        // Then process each campaign individually to assign statistics
        let processedCount = 0;
        let successCount = 0;
        
        for (let i = 0; i < updatedCampaigns.length; i++) {
          const campaign = updatedCampaigns[i];
          const campaignUid = campaign.uid || campaign.campaign_uid;
          
          if (campaignUid) {
            try {
              // Retrieve and process statistics with cache
              const result = await fetchAndProcessCampaignStats(campaign, account!, {
                demoMode,
                useCache: true,
                forceRefresh: true
              });
              
              // Check if we got actual statistics
              const hasStats = result.statistics && 
                (result.statistics.subscriber_count > 0 || 
                 result.statistics.delivered_count > 0 || 
                 result.statistics.open_count > 0);
              
              if (hasStats) {
                successCount++;
              }
              
              // Update the campaign with retrieved statistics
              updatedCampaigns[i].statistics = result.statistics;
              
              // Update delivery_info if necessary
              if (!updatedCampaigns[i].delivery_info && result.delivery_info) {
                updatedCampaigns[i].delivery_info = result.delivery_info;
              }
              
              processedCount++;
              if (processedCount % 5 === 0 || processedCount === updatedCampaigns.length) {
                console.log(`${processedCount}/${updatedCampaigns.length} statistics loaded, ${successCount} with data`);
                toast.loading(`Chargement: ${processedCount}/${updatedCampaigns.length}`, { id: "batch-stats-loading" });
              }
            } catch (error) {
              console.error(`Error loading statistics for ${campaign.name}:`, error);
            }
          }
        }
        
        console.log(`Batch loading completed: ${processedCount}/${updatedCampaigns.length} campaigns processed, ${successCount} with statistics`);
        
        if (successCount > 0) {
          toast.success(`${successCount} campagnes avec statistiques chargées`, { id: "batch-stats-loading" });
        } else {
          toast.error("Aucune statistique n'a pu être chargée", { id: "batch-stats-loading" });
        }
        
        // Return the updated campaigns through the callback
        if (onBatchLoaded) onBatchLoaded(updatedCampaigns);
        
      } catch (error) {
        console.error("Error during batch loading of statistics:", error);
        toast.error("Erreur lors du chargement des statistiques", { id: "batch-stats-loading" });
      } finally {
        setIsLoading(false);
      }
    };
    
    // Start batch loading immediately
    loadBatchStatistics();
  }, [campaigns, account, demoMode, onBatchLoaded]);
  
  // This component doesn't render anything, it only triggers batch loading
  return null;
};
