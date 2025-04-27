
import React from "react";
import { AcelleCampaign } from "@/types/acelle.types";
import { useAcelleCampaignsTable } from "@/hooks/acelle/useAcelleCampaignsTable";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AcelleTableRow } from "../table/AcelleTableRow";
import { EmptyState } from "../table/LoadingAndErrorStates";

interface CampaignsListProps {
  campaigns: AcelleCampaign[];
}

const CampaignsList: React.FC<CampaignsListProps> = ({ campaigns }) => {
  const {
    searchTerm,
    setSearchTerm,
    filteredCampaigns
  } = useAcelleCampaignsTable(campaigns);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Campagnes récentes</h3>
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
        
        {filteredCampaigns.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Sujet</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date d'envoi</TableHead>
                  <TableHead>Taux d'ouv.</TableHead>
                  <TableHead>Taux de clic</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.slice(0, 5).map((campaign) => (
                  <AcelleTableRow
                    key={campaign.uid}
                    campaign={campaign}
                    onViewCampaign={() => {}}
                    simplified
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CampaignsList;
