
import { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  ArrowUpDown, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Search,
  RefreshCw
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { fetchUserStatistics, debugUserStatistics, UserWithStats } from "@/services/admin/userStatisticsService";

export const UserStatsTableNew = () => {
  const [activeTab, setActiveTab] = useState<"sdr" | "growth">("sdr");
  const [sortColumn, setSortColumn] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fonction pour charger les données
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("[UserStatsTableNew] 🔄 Chargement des statistiques utilisateur");
      
      const userData = await fetchUserStatistics();
      console.log("[UserStatsTableNew] ✅ Données chargées:", userData);
      setUsers(userData);
    } catch (err) {
      console.error("[UserStatsTableNew] ❌ Erreur:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage
  useEffect(() => {
    loadData();
  }, []);

  // Fonction de debug
  const handleDebug = async () => {
    console.log("🔧 DÉCLENCHEMENT DEBUG MANUEL");
    await debugUserStatistics();
    await loadData();
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleUserClick = (user: UserWithStats) => {
    console.log(`[UserStatsTableNew] 🖱️ Clic sur utilisateur ${activeTab}: ${user.name}`);
    
    if (activeTab === "sdr") {
      navigate("/growth", { state: { createdBy: user.id, userName: user.name } });
    } else {
      navigate("/growth", { state: { assignedTo: user.id, userName: user.name } });
    }
  };

  // Filtrer et trier les utilisateurs
  const filteredUsers = users
    .filter(user => {
      const matchesRole = user.role === activeTab;
      const matchesSearch = search === "" || 
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      return matchesRole && matchesSearch;
    })
    .sort((a, b) => {
      if (sortColumn === "name") {
        const aValue = a.name;
        const bValue = b.name;
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        const aValue = a.stats[sortColumn as keyof typeof a.stats] || 0;
        const bValue = b.stats[sortColumn as keyof typeof b.stats] || 0;
        return sortDirection === "asc" ? 
          (aValue as number) - (bValue as number) : 
          (bValue as number) - (aValue as number);
      }
    });

  const getSortIcon = (column: string) => {
    if (sortColumn === column) {
      return sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />;
    }
    return <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <h3 className="font-bold text-red-800">Erreur</h3>
        <p className="text-red-600">{error}</p>
        <Button onClick={loadData} className="mt-2" variant="outline">
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "sdr" | "growth")}>
            <TabsList>
              <TabsTrigger value="sdr">SDR</TabsTrigger>
              <TabsTrigger value="growth">Growth</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button onClick={handleDebug} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Debug
          </Button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort("name")} className="cursor-pointer">
                <div className="flex items-center">
                  Nom {getSortIcon("name")}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort("total")} className="cursor-pointer">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  Total {getSortIcon("total")}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort("pending")} className="cursor-pointer">
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-status-pending" />
                  En attente {getSortIcon("pending")}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort("completed")} className="cursor-pointer">
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-status-completed" />
                  Terminées {getSortIcon("completed")}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort("late")} className="cursor-pointer">
                <div className="flex items-center">
                  <AlertCircle className="mr-2 h-4 w-4 text-status-late" />
                  En retard {getSortIcon("late")}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow 
                  key={user.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleUserClick(user)}
                >
                  <TableCell className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{user.stats.total}</TableCell>
                  <TableCell className="font-medium">{user.stats.pending}</TableCell>
                  <TableCell className="font-medium">{user.stats.completed}</TableCell>
                  <TableCell className="font-medium">{user.stats.late}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Aucun utilisateur trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="text-xs text-muted-foreground">
        Total utilisateurs affichés: {filteredUsers.length} | 
        Dernière mise à jour: {new Date().toLocaleString()}
      </div>
    </div>
  );
};
