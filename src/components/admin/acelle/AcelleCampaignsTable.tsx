import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Eye, RefreshCw, Loader2 } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SelectValue, SelectTrigger, SelectItem, SelectContent, Select } from "@/components/ui/select";

import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { acelleService } from "@/services/acelle/acelle-service";
import AcelleCampaignDetails from "./AcelleCampaignDetails";

interface AcelleCampaignsTableProps {
  account: AcelleAccount;
}

export default function AcelleCampaignsTable({ account }: AcelleCampaignsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  
  const { 
    data: campaigns = [], 
    isLoading, 
    isError, 
    refetch,
    isFetching 
  } = useQuery({
    queryKey: ["acelleCampaigns", account.id],
    queryFn: () => acelleService.getAcelleCampaigns(account),
    enabled: account.status === "active",
  });

  const handleViewCampaign = (campaignUid: string) => {
    setSelectedCampaign(campaignUid);
  };

  const filteredCampaigns = campaigns
    .filter(campaign => 
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.subject.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(campaign => !statusFilter || campaign.status === statusFilter)
    .sort((a, b) => {
      let valueA: any;
      let valueB: any;

      if (sortBy === "created_at" || sortBy === "updated_at" || sortBy === "run_at") {
        valueA = a[sortBy] ? new Date(a[sortBy]).getTime() : 0;
        valueB = b[sortBy] ? new Date(b[sortBy]).getTime() : 0;
      } else if (sortBy === "name" || sortBy === "subject" || sortBy === "status") {
        valueA = a[sortBy].toLowerCase();
        valueB = b[sortBy].toLowerCase();
      } else if (sortBy === "open_rate") {
        valueA = a.delivery_info?.unique_open_rate || 0;
        valueB = b.delivery_info?.unique_open_rate || 0;
      } else if (sortBy === "click_rate") {
        valueA = a.delivery_info?.click_rate || 0;
        valueB = b.delivery_info?.click_rate || 0;
      } else {
        valueA = 0;
        valueB = 0;
      }

      return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
    });

  const translateStatus = (status: string) => {
    switch (status) {
      case "new": return "Nouveau";
      case "queued": return "En attente";
      case "sending": return "En cours d'envoi";
      case "sent": return "Envoyé";
      case "paused": return "En pause";
      case "failed": return "Échoué";
      default: return status;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "new": return "secondary";
      case "queued": return "outline";
      case "sending": return "default";
      case "sent": return "success";
      case "paused": return "warning";
      case "failed": return "destructive";
      default: return "outline";
    }
  };

  const renderPercentage = (value: number | undefined) => {
    if (value === undefined) return "N/A";
    return `${(value * 100).toFixed(1)}%`;
  };

  if (account.status === "inactive") {
    return (
      <div className="text-center py-8 border rounded-md bg-muted/20">
        <p className="text-muted-foreground">Le compte est inactif. Activez-le pour voir les campagnes.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8 border rounded-md bg-muted/20">
        <p className="text-red-500 mb-4">Erreur lors du chargement des campagnes</p>
        <Button onClick={() => refetch()}>Réessayer</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Campagnes - {account.name}</h2>
        <Button 
          onClick={() => refetch()} 
          disabled={isFetching} 
          variant="outline"
        >
          {isFetching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Synchronisation...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Synchroniser
            </>
          )}
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="w-full md:w-1/3">
          <Input
            placeholder="Rechercher une campagne..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="w-full md:w-1/4">
          <Select
            value={statusFilter || "all"}
            onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="new">Nouveau</SelectItem>
              <SelectItem value="queued">En attente</SelectItem>
              <SelectItem value="sending">En cours d'envoi</SelectItem>
              <SelectItem value="sent">Envoyé</SelectItem>
              <SelectItem value="paused">En pause</SelectItem>
              <SelectItem value="failed">Échoué</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full md:w-1/4">
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Date de création</SelectItem>
              <SelectItem value="run_at">Date d'envoi</SelectItem>
              <SelectItem value="name">Nom</SelectItem>
              <SelectItem value="subject">Sujet</SelectItem>
              <SelectItem value="status">Statut</SelectItem>
              <SelectItem value="open_rate">Taux d'ouverture</SelectItem>
              <SelectItem value="click_rate">Taux de clic</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full md:w-1/6">
          <Select
            value={sortOrder}
            onValueChange={(value: "asc" | "desc") => setSortOrder(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Ordre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascendant</SelectItem>
              <SelectItem value="desc">Descendant</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {campaigns.length === 0 ? (
        <div className="text-center py-8 border rounded-md bg-muted/20">
          <p className="text-muted-foreground">Aucune campagne trouvée pour ce compte</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Sujet</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date d'envoi</TableHead>
                <TableHead>Envoyés</TableHead>
                <TableHead>Taux d'ouverture</TableHead>
                <TableHead>Taux de clic</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => (
                <TableRow key={campaign.uid}>
                  <TableCell className="font-medium max-w-[120px] truncate">
                    {campaign.name}
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate">
                    {campaign.subject}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(campaign.status) as any}>
                      {translateStatus(campaign.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {campaign.run_at 
                      ? format(new Date(campaign.run_at), "dd/MM/yyyy HH:mm", { locale: fr }) 
                      : "Non programmé"}
                  </TableCell>
                  <TableCell>
                    {campaign.delivery_info?.total || 0}
                  </TableCell>
                  <TableCell>
                    {renderPercentage(campaign.delivery_info?.unique_open_rate)}
                  </TableCell>
                  <TableCell>
                    {renderPercentage(campaign.delivery_info?.click_rate)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewCampaign(campaign.uid)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!selectedCampaign} onOpenChange={(open) => !open && setSelectedCampaign(null)}>
        <DialogContent className="max-w-4xl h-[80vh] max-h-[800px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la campagne</DialogTitle>
          </DialogHeader>
          {selectedCampaign && (
            <AcelleCampaignDetails 
              account={account}
              campaignUid={selectedCampaign}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
