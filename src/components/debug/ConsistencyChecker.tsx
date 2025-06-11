
import { useState } from "react";
import { Request } from "@/types/types";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ConsistencyCheckerProps {
  allRequests: Request[];
  getFilteredRequests: (filterType: string, requests: Request[]) => Request[];
}

export const ConsistencyChecker = ({ allRequests, getFilteredRequests }: ConsistencyCheckerProps) => {
  const { user } = useAuth();
  const [showDetails, setShowDetails] = useState(false);
  
  // Reproduire EXACTEMENT la même logique que GrowthStatsCardsFixed
  const activeRequests = allRequests.filter(req => 
    req.workflow_status !== 'completed' && req.workflow_status !== 'canceled'
  );
  
  const statsCalculations = {
    all: activeRequests.length,
    to_assign: activeRequests.filter(req => 
      !req.assigned_to || 
      req.assigned_to === '' || 
      req.assigned_to === null || 
      req.assigned_to === 'Non assigné'
    ).length,
    my_assignments: activeRequests.filter(req => 
      req.assigned_to === user?.id || 
      req.assigned_to === user?.email || 
      req.assigned_to === user?.name
    ).length,
    pending: activeRequests.filter((r) => 
      r.status === "pending" || r.workflow_status === "pending_assignment"
    ).length,
    inprogress: activeRequests.filter((r) => 
      r.workflow_status === "in_progress"
    ).length,
    completed: allRequests.filter((r) => 
      r.workflow_status === "completed"
    ).length,
    late: activeRequests.filter((r) => r.isLate).length
  };

  // Calculer les données filtrées avec la fonction du dashboard
  const tableFiltered = {
    all: getFilteredRequests('all', allRequests).length,
    to_assign: getFilteredRequests('to_assign', allRequests).length,
    my_assignments: getFilteredRequests('my_assignments', allRequests).length,
    pending: getFilteredRequests('pending', allRequests).length,
    inprogress: getFilteredRequests('inprogress', allRequests).length,
    completed: getFilteredRequests('completed', allRequests).length,
    late: getFilteredRequests('late', allRequests).length
  };

  // Analyser les incohérences
  const inconsistencies = Object.keys(statsCalculations).filter(key => 
    statsCalculations[key as keyof typeof statsCalculations] !== 
    tableFiltered[key as keyof typeof tableFiltered]
  );

  // Détails des demandes pour debug
  const getDetailedAnalysis = (filterType: string) => {
    const statsRequests = (() => {
      switch (filterType) {
        case 'all': return activeRequests;
        case 'to_assign': return activeRequests.filter(req => 
          !req.assigned_to || req.assigned_to === '' || req.assigned_to === null || req.assigned_to === 'Non assigné'
        );
        case 'my_assignments': return activeRequests.filter(req => 
          req.assigned_to === user?.id || req.assigned_to === user?.email || req.assigned_to === user?.name
        );
        case 'pending': return activeRequests.filter((r) => 
          r.status === "pending" || r.workflow_status === "pending_assignment"
        );
        case 'inprogress': return activeRequests.filter((r) => 
          r.workflow_status === "in_progress"
        );
        case 'completed': return allRequests.filter((r) => 
          r.workflow_status === "completed"
        );
        case 'late': return activeRequests.filter((r) => r.isLate);
        default: return [];
      }
    })();

    const tableRequests = getFilteredRequests(filterType, allRequests);

    return {
      statsRequests: statsRequests.map(r => ({
        id: r.id,
        title: r.title,
        assigned_to: r.assigned_to,
        workflow_status: r.workflow_status,
        status: r.status,
        isLate: r.isLate
      })),
      tableRequests: tableRequests.map(r => ({
        id: r.id,
        title: r.title,
        assigned_to: r.assigned_to,
        workflow_status: r.workflow_status,
        status: r.status,
        isLate: r.isLate
      }))
    };
  };

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-900 flex items-center justify-between">
          🔍 Vérification de cohérence Stats ↔ Tableau
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Masquer' : 'Détails'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {inconsistencies.length === 0 ? (
            <div className="text-green-700 font-semibold">
              ✅ Toutes les statistiques sont cohérentes avec le tableau !
            </div>
          ) : (
            <div className="text-red-700">
              ❌ {inconsistencies.length} incohérence(s) détectée(s) :
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(statsCalculations).map(([filterType, statsCount]) => {
              const tableCount = tableFiltered[filterType as keyof typeof tableFiltered];
              const isInconsistent = statsCount !== tableCount;
              
              return (
                <div 
                  key={filterType}
                  className={`p-3 rounded border ${isInconsistent ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}`}
                >
                  <div className="font-semibold text-sm">{filterType}</div>
                  <div className="flex justify-between items-center">
                    <span>Stats: {statsCount}</span>
                    <span>Table: {tableCount}</span>
                  </div>
                  {isInconsistent && (
                    <Badge variant="destructive" className="text-xs mt-1">
                      Incohérent !
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>

          {showDetails && inconsistencies.length > 0 && (
            <div className="mt-6 space-y-4">
              <h4 className="font-semibold text-orange-900">Analyse détaillée des incohérences :</h4>
              {inconsistencies.map(filterType => {
                const analysis = getDetailedAnalysis(filterType);
                const statsIds = new Set(analysis.statsRequests.map(r => r.id));
                const tableIds = new Set(analysis.tableRequests.map(r => r.id));
                
                const onlyInStats = analysis.statsRequests.filter(r => !tableIds.has(r.id));
                const onlyInTable = analysis.tableRequests.filter(r => !statsIds.has(r.id));
                
                return (
                  <div key={filterType} className="border p-3 rounded bg-white">
                    <h5 className="font-semibold text-red-700">Filtre: {filterType}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div>
                        <div className="text-sm font-medium">Stats ({analysis.statsRequests.length}):</div>
                        <div className="text-xs space-y-1 max-h-40 overflow-y-auto">
                          {analysis.statsRequests.map(r => (
                            <div key={r.id} className="truncate">
                              {r.title} - {r.workflow_status} - {r.assigned_to || 'null'}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Table ({analysis.tableRequests.length}):</div>
                        <div className="text-xs space-y-1 max-h-40 overflow-y-auto">
                          {analysis.tableRequests.map(r => (
                            <div key={r.id} className="truncate">
                              {r.title} - {r.workflow_status} - {r.assigned_to || 'null'}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {(onlyInStats.length > 0 || onlyInTable.length > 0) && (
                      <div className="mt-3 pt-3 border-t">
                        {onlyInStats.length > 0 && (
                          <div className="text-red-600 text-sm">
                            Seulement dans Stats ({onlyInStats.length}): {onlyInStats.map(r => r.title).join(', ')}
                          </div>
                        )}
                        {onlyInTable.length > 0 && (
                          <div className="text-blue-600 text-sm">
                            Seulement dans Table ({onlyInTable.length}): {onlyInTable.map(r => r.title).join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
