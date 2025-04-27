
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CampaignsListProps {
  campaigns: any[];
}

const CampaignsList: React.FC<CampaignsListProps> = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dernières campagnes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date d'envoi</TableHead>
              <TableHead>Ouvertures</TableHead>
              <TableHead>Clics</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                Fonctionnalité de campagnes par email retirée
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default CampaignsList;
