
import { useState, useMemo } from "react";
import { AcelleCampaign } from "@/types/acelle.types";

export const useAcelleCampaignsTable = (campaigns: AcelleCampaign[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  // Utiliser useMemo pour éviter de recalculer le filtrage à chaque rendu
  const filteredCampaigns = useMemo(() => {
    return campaigns
      .filter(campaign => 
        (campaign.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (campaign.subject?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
      )
      .filter(campaign => !statusFilter || campaign.status === statusFilter)
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
          valueA = a.delivery_info?.unique_open_rate || a.statistics?.uniq_open_rate || 0;
          valueB = b.delivery_info?.unique_open_rate || b.statistics?.uniq_open_rate || 0;
        } else if (sortBy === "click_rate") {
          valueA = a.delivery_info?.click_rate || a.statistics?.click_rate || 0;
          valueB = b.delivery_info?.click_rate || b.statistics?.click_rate || 0;
        } else if (sortBy === "subscriber_count") {
          valueA = a.delivery_info?.total || a.statistics?.subscriber_count || 0;
          valueB = b.delivery_info?.total || b.statistics?.subscriber_count || 0;
        } else {
          valueA = 0;
          valueB = 0;
        }

        return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
      });
  }, [campaigns, searchTerm, statusFilter, sortBy, sortOrder]);

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
