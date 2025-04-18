
import { useState } from 'react';
import { toast } from 'sonner';
import { Request } from '@/types/types';

interface NewDashboardFiltersProps {
  allRequests: Request[] | undefined;
  onFilterChange: (filterType: string | null) => void;
  pendingCount: number;
  completedCount: number;
  overdueCount: number;
}

export const NewDashboardFilters = ({ 
  allRequests, 
  onFilterChange,
  pendingCount,
  completedCount,
  overdueCount
}: NewDashboardFiltersProps) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
  const handleFilterClick = (filterType: string) => {
    console.log("[DEBUG] NewDashboardFilters - Filter clicked:", filterType);
    
    if (activeFilter === filterType) {
      setActiveFilter(null);
      onFilterChange(null);
      toast.success('Filtres réinitialisés');
    } else {
      setActiveFilter(filterType);
      onFilterChange(filterType);
      toast.success(`Filtrage par ${
        filterType === 'pending' ? 'demandes en attente' : 
        filterType === 'completed' ? 'demandes terminées' : 
        filterType === 'late' ? 'demandes en retard' : 
        'toutes les demandes'
      }`);
    }
  };

  const cards = [
    { id: 'all', title: 'Total des demandes', count: allRequests?.length || 0 },
    { id: 'pending', title: 'En attente', count: pendingCount },
    { id: 'completed', title: 'Terminées', count: completedCount },
    { id: 'late', title: 'En retard', count: overdueCount }
  ];

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {cards.map(card => (
        <div
          key={card.id}
          onClick={() => handleFilterClick(card.id)}
          className={`
            bg-background p-6 rounded-lg border cursor-pointer transition-all
            hover:shadow-md hover:bg-accent/10
            ${activeFilter === card.id ? 'ring-2 ring-primary border-primary bg-accent/50' : ''}
          `}
        >
          <h3 className="text-sm font-medium text-muted-foreground">{card.title}</h3>
          <p className="text-2xl font-bold mt-2">{card.count}</p>
        </div>
      ))}
    </div>
  );
};
