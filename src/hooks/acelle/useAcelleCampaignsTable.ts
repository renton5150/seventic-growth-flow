
import { useState, useMemo } from "react";
import { AcelleCampaign } from "@/types/acelle.types";

export const useAcelleCampaignsTable = (campaigns: AcelleCampaign[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  // Limiter à 5 campagnes par page après filtrage et tri
  const filteredCampaigns = useMemo(() => {
    // Log pour le débogage
    console.log(`Filtrage des campagnes: ${campaigns.length} disponibles`, {
      searchTerm,
      statusFilter,
      sortBy,
      sortOrder
    });
    
    // S'assurer que campaigns est un tableau valide
    if (!Array.isArray(campaigns)) {
      console.warn("campaigns n'est pas un tableau valide", campaigns);
      return [];
    }
    
    return campaigns
      .filter(campaign => {
        // Filtrage par terme de recherche
        const nameMatch = campaign.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        const subjectMatch = campaign.subject?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        const matchesSearch = !searchTerm || nameMatch || subjectMatch;
        
        // Filtrage par statut
        const matchesStatus = !statusFilter || campaign.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        let valueA: any;
        let valueB: any;

        if (sortBy === "created_at" || sortBy === "updated_at" || sortBy === "run_at" || sortBy === "delivery_date") {
          valueA = a[sortBy] ? new Date(a[sortBy]).getTime() : 0;
          valueB = b[sortBy] ? new Date(b[sortBy]).getTime() : 0;
        } else if (sortBy === "name" || sortBy === "subject" || sortBy === "status") {
          valueA = a[sortBy]?.toLowerCase() || '';
          valueB = b[sortBy]?.toLowerCase() || '';
        } else if (sortBy === "open_rate") {
          // Tentative de récupération du taux d'ouverture dans différents emplacements
          valueA = getStatValue(a, 'open_rate', 'unique_open_rate', 'uniq_open_rate');
          valueB = getStatValue(b, 'open_rate', 'unique_open_rate', 'uniq_open_rate');
        } else if (sortBy === "click_rate") {
          valueA = getStatValue(a, 'click_rate');
          valueB = getStatValue(b, 'click_rate');
        } else if (sortBy === "subscriber_count") {
          valueA = getStatValue(a, 'subscriber_count', 'total');
          valueB = getStatValue(b, 'subscriber_count', 'total');
        } else {
          valueA = 0;
          valueB = 0;
        }

        return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
      })
      .slice(0, 5);
  }, [campaigns, searchTerm, statusFilter, sortBy, sortOrder]);
  
  // Fonction helper pour récupérer des statistiques d'une campagne
  const getStatValue = (campaign: AcelleCampaign, ...keys: string[]): number => {
    if (!campaign) return 0;
    
    // Chercher dans delivery_info
    if (campaign.delivery_info) {
      for (const key of keys) {
        if (typeof campaign.delivery_info[key] === 'number') {
          return campaign.delivery_info[key];
        }
      }
    }
    
    // Chercher dans statistics
    if (campaign.statistics) {
      for (const key of keys) {
        if (typeof campaign.statistics[key] === 'number') {
          return campaign.statistics[key];
        }
      }
    }
    
    // Chercher directement dans la campagne
    for (const key of keys) {
      if (typeof campaign[key] === 'number') {
        return campaign[key];
      }
    }
    
    return 0;
  };

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    selectedCampaign,
    setSelectedCampaign,
    filteredCampaigns
  };
};
