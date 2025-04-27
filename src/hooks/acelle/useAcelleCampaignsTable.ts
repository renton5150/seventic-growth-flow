
/**
 * Hook placeholder for handling Acelle campaigns table state
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
