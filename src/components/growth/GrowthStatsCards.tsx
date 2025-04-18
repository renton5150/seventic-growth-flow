
import { useState } from 'react';
import { Request } from '@/types/types';

interface GrowthStatsCardsProps {
  data: Request[];
  onFilterChange: (filter: string | null) => void;
}

export function GrowthStatsCards({ data, onFilterChange }: GrowthStatsCardsProps) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
  console.log('GrowthStatsCards rendering with data:', data);

  // Calculate stats with fallback values
  const stats = {
    total: data?.length || 0,
    pending: data?.filter(item => ['pending', 'in_progress'].includes(item.workflow_status || '')).length || 0,
    completed: data?.filter(item => item.workflow_status === 'completed').length || 0,
    overdue: data?.filter(item => item.isLate).length || 0
  };

  const handleFilterClick = (filterId: string) => {
    const newFilter = activeFilter === filterId ? null : filterId;
    setActiveFilter(newFilter);
    onFilterChange(newFilter);
    console.log(`Filter ${filterId} activated:`, newFilter);
  };
  
  return (
    <div className="mb-6 bg-white rounded-lg p-2">
      <h2 className="text-lg font-semibold mb-3 px-2">Statistiques</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => handleFilterClick('all')}
          className={`
            p-3 border rounded-lg text-left 
            ${activeFilter === 'all' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}
          `}
        >
          <div className="text-gray-500 text-sm">Total des demandes</div>
          <div className="text-xl font-bold mt-1">{stats.total}</div>
        </button>
        
        <button
          type="button"
          onClick={() => handleFilterClick('pending')}
          className={`
            p-3 border rounded-lg text-left
            ${activeFilter === 'pending' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}
          `}
        >
          <div className="text-gray-500 text-sm">En attente</div>
          <div className="text-xl font-bold mt-1">{stats.pending}</div>
        </button>
        
        <button
          type="button"
          onClick={() => handleFilterClick('completed')}
          className={`
            p-3 border rounded-lg text-left
            ${activeFilter === 'completed' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}
          `}
        >
          <div className="text-gray-500 text-sm">Terminées</div>
          <div className="text-xl font-bold mt-1">{stats.completed}</div>
        </button>
        
        <button
          type="button"
          onClick={() => handleFilterClick('overdue')}
          className={`
            p-3 border rounded-lg text-left
            ${activeFilter === 'overdue' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}
          `}
        >
          <div className="text-gray-500 text-sm">En retard</div>
          <div className="text-xl font-bold mt-1">{stats.overdue}</div>
        </button>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 bg-gray-100 p-2 rounded text-xs">
          <p>Filtre actif: {activeFilter || 'Aucun'}</p>
          <p>Nombre total: {stats.total}</p>
        </div>
      )}
    </div>
  );
}
