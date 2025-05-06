
import { useState, useMemo } from 'react';
import { AcelleCampaign } from "@/types/acelle.types";

interface UseAcelleCampaignsTableProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (value: 'asc' | 'desc') => void;
  filteredCampaigns: AcelleCampaign[];
}

export const useAcelleCampaignsTable = (campaigns: AcelleCampaign[]): UseAcelleCampaignsTableProps => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filtrer les campagnes en fonction des critères
  const filteredCampaigns = useMemo(() => {
    // Copier les campagnes pour éviter de modifier l'original
    let result = [...campaigns];
    
    // Filtrer par mot-clé de recherche (nom ou sujet)
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        campaign => 
          (campaign.name && campaign.name.toLowerCase().includes(search)) || 
          (campaign.subject && campaign.subject.toLowerCase().includes(search))
      );
    }
    
    // Filtrer par statut
    if (statusFilter && statusFilter !== 'all') {
      result = result.filter(
        campaign => campaign.status && campaign.status.toLowerCase() === statusFilter
      );
    }
    
    // Trier les résultats
    result.sort((a, b) => {
      let valueA, valueB;
      
      // Récupérer les valeurs à comparer selon le critère de tri
      switch (sortBy) {
        case 'name':
          valueA = a.name?.toLowerCase() || '';
          valueB = b.name?.toLowerCase() || '';
          break;
        case 'subject':
          valueA = a.subject?.toLowerCase() || '';
          valueB = b.subject?.toLowerCase() || '';
          break;
        case 'status':
          valueA = a.status?.toLowerCase() || '';
          valueB = b.status?.toLowerCase() || '';
          break;
        case 'delivery_date':
          valueA = a.delivery_date ? new Date(a.delivery_date).getTime() : 0;
          valueB = b.delivery_date ? new Date(b.delivery_date).getTime() : 0;
          break;
        case 'subscriber_count':
          valueA = a.statistics?.subscriber_count || a.delivery_info?.total || 0;
          valueB = b.statistics?.subscriber_count || b.delivery_info?.total || 0;
          break;
        case 'open_rate':
          valueA = a.statistics?.uniq_open_rate || a.delivery_info?.unique_open_rate || 0;
          valueB = b.statistics?.uniq_open_rate || b.delivery_info?.unique_open_rate || 0;
          break;
        case 'click_rate':
          valueA = a.statistics?.click_rate || a.delivery_info?.click_rate || 0;
          valueB = b.statistics?.click_rate || b.delivery_info?.click_rate || 0;
          break;
        case 'bounce_count':
          valueA = a.statistics?.bounce_count || 
                  (typeof a.delivery_info?.bounced === 'number' ? a.delivery_info.bounced : 0);
          valueB = b.statistics?.bounce_count || 
                  (typeof b.delivery_info?.bounced === 'number' ? b.delivery_info.bounced : 0);
          break;
        case 'last_updated':
          // Utiliser la date de dernière mise à jour si disponible
          valueA = a.last_updated ? new Date(a.last_updated).getTime() : 0;
          valueB = b.last_updated ? new Date(b.last_updated).getTime() : 0;
          break;
        case 'created_at':
        default:
          valueA = a.created_at ? new Date(a.created_at).getTime() : 0;
          valueB = b.created_at ? new Date(b.created_at).getTime() : 0;
      }
      
      // Comparer les valeurs selon l'ordre de tri
      if (sortOrder === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
    
    return result;
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
    filteredCampaigns
  };
};
