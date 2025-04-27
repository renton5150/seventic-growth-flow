
import { useState } from "react";
import { AcelleCampaign } from "@/types/acelle.types";

export const useAcelleCampaignsTable = (campaigns: AcelleCampaign[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  // S'assurer que campaigns est toujours un tableau
  const safeCampaigns = Array.isArray(campaigns) ? campaigns : [];

  const filteredCampaigns = safeCampaigns
    .filter(campaign => 
      campaign && campaign.name && 
      campaign.name.toLowerCase().includes((searchTerm || "").toLowerCase()) ||
      (campaign.subject && campaign.subject.toLowerCase().includes((searchTerm || "").toLowerCase()))
    )
    .filter(campaign => !statusFilter || (campaign && campaign.status === statusFilter))
    .sort((a, b) => {
      if (!a || !b) return 0;
      
      let valueA: any;
      let valueB: any;

      if (sortBy === "created_at" || sortBy === "updated_at" || sortBy === "run_at") {
        valueA = a[sortBy] ? new Date(a[sortBy]).getTime() : 0;
        valueB = b[sortBy] ? new Date(b[sortBy]).getTime() : 0;
      } else if (sortBy === "name" || sortBy === "subject" || sortBy === "status") {
        valueA = (a[sortBy] || "").toLowerCase();
        valueB = (b[sortBy] || "").toLowerCase();
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
