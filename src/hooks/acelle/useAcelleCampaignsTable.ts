
/**
 * Hook implémenté pour gérer le tableau des campagnes Acelle
 */

export const useAcelleCampaignsTable = (campaigns: any[] = []) => {
  return {
    searchTerm: '',
    setSearchTerm: () => {},
    statusFilter: 'all',
    setStatusFilter: () => {},
    sortBy: 'created_at',
    setSortBy: () => {},
    sortOrder: 'desc' as 'asc' | 'desc',
    setSortOrder: () => {},
    filteredCampaigns: []
  };
};
