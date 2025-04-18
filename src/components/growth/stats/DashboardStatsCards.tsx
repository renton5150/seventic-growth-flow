
import { useState } from 'react';
import { toast } from 'sonner';
import { Request } from '@/types/types';

interface DashboardStatsCardsProps {
  requestsData: Request[] | undefined;
  onFilterChange: (filter: string | null) => void;
}

export function DashboardStatsCards({ onFilterChange, requestsData }: DashboardStatsCardsProps) {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  
  // Calculate counts
  const totalCount = requestsData?.length || 0;
  const pendingCount = requestsData?.filter(r => 
    r.status === "pending" || r.workflow_status === "pending_assignment"
  )?.length || 0;
  const completedCount = requestsData?.filter(r => 
    r.workflow_status === "completed"
  )?.length || 0;
  const overdueCount = requestsData?.filter(r => r.isLate)?.length || 0;
  
  const handleCardClick = (cardId: string) => {
    console.log("[DEBUG] DashboardStatsCards - Card clicked:", cardId);
    
    if (activeCardId === cardId) {
      setActiveCardId(null);
      onFilterChange(null);
      toast.success('Filtres réinitialisés');
    } else {
      setActiveCardId(cardId);
      onFilterChange(cardId);
      
      const messages: Record<string, string> = {
        'all': 'Affichage de toutes les demandes',
        'pending': 'Affichage des demandes en attente',
        'completed': 'Affichage des demandes terminées',
        'late': 'Affichage des demandes en retard'
      };
      toast.success(messages[cardId] || 'Filtre appliqué');
    }
  };
  
  const cards = [
    { id: 'all', title: 'Total des demandes', count: totalCount },
    { id: 'pending', title: 'En attente', count: pendingCount },
    { id: 'completed', title: 'Terminées', count: completedCount },
    { id: 'late', title: 'En retard', count: overdueCount }
  ];
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map(card => (
        <button
          key={card.id}
          type="button"
          onClick={() => handleCardClick(card.id)}
          className={`
            bg-background p-6 rounded-lg border cursor-pointer
            transition-all duration-200 ease-in-out w-full
            ${activeCardId === card.id ? 'ring-2 ring-primary border-primary bg-accent/50' : 'hover:bg-accent/10'}
          `}
        >
          <h3 className="text-sm font-medium text-muted-foreground">{card.title}</h3>
          <p className="text-2xl font-bold mt-2">{card.count}</p>
        </button>
      ))}
    </div>
  );
}
