
import { Request } from "@/types/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GrowthFilterService } from "@/services/filtering/growthFilterService";
import { useAuth } from "@/contexts/AuthContext";

interface SimpleDebugPanelProps {
  allRequests: Request[];
  filteredRequests: Request[];
  currentFilter: string;
}

export const SimpleDebugPanel = ({ 
  allRequests, 
  filteredRequests, 
  currentFilter 
}: SimpleDebugPanelProps) => {
  const { user } = useAuth();
  
  // Utiliser le même service de filtrage
  const filterService = new GrowthFilterService(user?.id);
  const counts = filterService.calculateCounts(allRequests);
  const expectedCount = filterService.filterRequests(currentFilter, allRequests).length;
  const actualCount = filteredRequests.length;
  const isConsistent = expectedCount === actualCount;
  
  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-900 flex items-center justify-between">
          🔍 Diagnostic simplifié - Stats ↔ Tableau
          <Badge variant={isConsistent ? "default" : "destructive"}>
            {isConsistent ? "✅ Cohérent" : "❌ Incohérent"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded border bg-white">
            <div className="font-semibold text-sm">Total brut</div>
            <div className="text-lg">{allRequests.length}</div>
          </div>
          
          <div className="p-3 rounded border bg-white">
            <div className="font-semibold text-sm">Actives</div>
            <div className="text-lg">{filterService.getActiveRequests(allRequests).length}</div>
          </div>
          
          <div className="p-3 rounded border bg-white">
            <div className="font-semibold text-sm">Attendu ({currentFilter})</div>
            <div className="text-lg">{expectedCount}</div>
          </div>
          
          <div className={`p-3 rounded border ${isConsistent ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
            <div className="font-semibold text-sm">Affiché</div>
            <div className="text-lg">{actualCount}</div>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-3 md:grid-cols-7 gap-2 text-xs">
          {Object.entries(counts).map(([key, count]) => (
            <div key={key} className="text-center p-2 bg-white rounded border">
              <div className="font-medium">{key}</div>
              <div>{count}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
