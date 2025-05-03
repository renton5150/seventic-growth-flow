
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AcelleCampaign, AcelleAccount } from "@/types/acelle.types";
import { AcelleTableRow } from "../table/AcelleTableRow";
import { CampaignsTableHeader } from "../table/TableHeader";
import { AcelleTableBatchLoader } from "../table/AcelleTableBatchLoader";

interface TableContentProps {
  campaigns: AcelleCampaign[];
  account?: AcelleAccount;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (column: string) => void;
  onViewCampaign: (uid: string) => void;
  demoMode?: boolean;
}

export const TableContent = ({
  campaigns,
  account,
  sortBy,
  sortOrder,
  onSort,
  onViewCampaign,
  demoMode = false
}: TableContentProps) => {
  const [isStatsLoaded, setIsStatsLoaded] = useState(false);

  // À chaque changement de campagnes, réinitialiser l'état du chargement des statistiques
  useEffect(() => {
    setIsStatsLoaded(false);
  }, [campaigns]);
  
  // Fonction de rappel appelée lorsque le chargement par lot est terminé
  const handleBatchLoaded = () => {
    setIsStatsLoaded(true);
    console.log("Toutes les statistiques ont été chargées par lot");
  };

  return (
    <div className="rounded-md border">
      {/* Chargeur par lot des statistiques (invisible) */}
      <AcelleTableBatchLoader 
        campaigns={campaigns} 
        account={account}
        demoMode={demoMode}
        onBatchLoaded={handleBatchLoaded}
      />
      
      <Table>
        <TableHeader>
          <TableRow>
            <CampaignsTableHeader 
              columns={[
                { key: "name", label: "Nom" },
                { key: "subject", label: "Sujet" },
                { key: "status", label: "Statut" },
                { key: "delivery_date", label: "Date d'envoi" },
                { key: "subscriber_count", label: "Destinataires" },
                { key: "open_rate", label: "Taux d'ouverture" },
                { key: "click_rate", label: "Taux de clic" },
                { key: "bounce_count", label: "Bounces" },
                { key: "", label: "" }
              ]}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={onSort}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => (
            <AcelleTableRow 
              key={campaign.uid || campaign.campaign_uid} 
              campaign={campaign} 
              account={account}
              onViewCampaign={onViewCampaign}
              demoMode={demoMode}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
