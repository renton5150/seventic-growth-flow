
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AcelleAccount } from "@/types/acelle.types";
import { acelleService } from "@/services/acelle/acelle-service";
import { DataUnavailableAlert } from "./errors/DataUnavailableAlert";

// Define the interface for component props
interface AcelleCampaignDetailsProps {
  account: AcelleAccount;
  campaignUid: string;
}

// Update function to accept props
const AcelleCampaignDetails: React.FC<AcelleCampaignDetailsProps> = ({ account, campaignUid }) => {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: campaignDetails, isLoading, isError } = useQuery({
    queryKey: ["campaignDetails", account?.id, campaignUid],
    queryFn: () => acelleService.fetchCampaignDetails(account, campaignUid),
    enabled: !!account && !!campaignUid,
    staleTime: 60 * 1000, // 1 minute
    meta: {
      onError: (error: any) => {
        toast.error(`Erreur lors du chargement des détails de la campagne: ${error}`);
      }
    }
  });

  if (isLoading) {
    return <div className="py-8 text-center">Chargement des détails de la campagne...</div>;
  }

  if (isError || !campaignDetails) {
    return <DataUnavailableAlert message="Impossible de charger les détails de cette campagne" />;
  }

  return (
    <div className="space-y-6">
      {/* Campaign header */}
      <div>
        <h2 className="text-xl font-semibold">{campaignDetails.name}</h2>
        <p className="text-muted-foreground">{campaignDetails.subject}</p>
      </div>
      
      {/* Campaign details tabs */}
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="statistics">Statistiques</TabsTrigger>
          <TabsTrigger value="timeline">Chronologie</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {/* Display campaign overview */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-1">Status</h3>
              <p>{campaignDetails.status}</p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Date d'envoi</h3>
              <p>{new Date(campaignDetails.run_at).toLocaleDateString('fr-FR')}</p>
            </div>
            {/* Add more campaign details as needed */}
          </div>
        </TabsContent>
        
        <TabsContent value="statistics" className="space-y-4">
          {/* Statistics content */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-3 rounded-md">
              <h3 className="text-sm font-medium text-muted-foreground">Envoyés</h3>
              <p className="text-2xl font-bold">{campaignDetails.statistics?.delivered_rate || 0}%</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-md">
              <h3 className="text-sm font-medium text-muted-foreground">Taux d'ouverture</h3>
              <p className="text-2xl font-bold">{campaignDetails.statistics?.uniq_open_rate || 0}%</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-md">
              <h3 className="text-sm font-medium text-muted-foreground">Taux de clic</h3>
              <p className="text-2xl font-bold">{campaignDetails.statistics?.click_rate || 0}%</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-md">
              <h3 className="text-sm font-medium text-muted-foreground">Désabonnements</h3>
              <p className="text-2xl font-bold">{(campaignDetails.statistics?.unsubscribe_count || 0) / (campaignDetails.statistics?.subscriber_count || 1) * 100}%</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="timeline" className="space-y-4">
          {/* Timeline content */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 p-1 rounded-full">
                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
              </div>
              <div>
                <div className="font-medium">Campagne créée</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(campaignDetails.created_at).toLocaleString('fr-FR')}
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-green-100 p-1 rounded-full">
                <div className="h-2 w-2 bg-green-600 rounded-full"></div>
              </div>
              <div>
                <div className="font-medium">Campagne envoyée</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(campaignDetails.run_at).toLocaleString('fr-FR')}
                </div>
              </div>
            </div>
            
            {campaignDetails.last_error && (
              <div className="flex items-start space-x-3">
                <div className="bg-red-100 p-1 rounded-full">
                  <div className="h-2 w-2 bg-red-600 rounded-full"></div>
                </div>
                <div>
                  <div className="font-medium">Erreur détectée</div>
                  <div className="text-sm text-red-600">{campaignDetails.last_error}</div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AcelleCampaignDetails;
