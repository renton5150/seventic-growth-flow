
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
  RefreshCw,
  UserX
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

  // Fonction pour charger les données FINALES CORRIGÉES
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("[UserStatsTableNew] 🔄 Chargement des statistiques utilisateur - LOGIQUE FINALE CORRIGÉE");
      
      const userData = await fetchUserStatistics();
      console.log("[UserStatsTableNew] ✅ Données chargées FINALES CORRIGÉES:", userData);
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

  // Fonction de debug FINALE CORRIGÉE
  const handleDebug = async () => {
    console.log("🔧 DÉCLENCHEMENT DEBUG MANUEL FINAL CORRIGÉ");
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
    console.log(`[UserStatsTableNew] 🖱️ Clic sur utilisateur ${activeTab}: ${user.name} (ID: ${user.id})`);
    
    if (activeTab === "sdr") {
      // Pour les SDR, filtrer par createdBy - ROUTE CORRIGÉE
      console.log(`[UserStatsTableNew] 📋 Navigation SDR - Filtrage par createdBy: ${user.id}`);
      navigate("/growth-dashboard", { 
        state: { 
          createdBy: user.id, 
          userName: user.name,
          filterType: 'sdr',
          userId: user.id
        } 
      });
    } else {
      // Pour les Growth, filtrer par assignedTo - ROUTE CORRIGÉE
      console.log(`[UserStatsTableNew] 📋 Navigation Growth - Filtrage par assignedTo: ${user.id}`);
      navigate("/growth-dashboard", { 
        state: { 
          assignedTo: user.id, 
          userName: user.name,
          filterType: 'growth',
          userId: user.id
        } 
      });
    }
  };

  // NOUVELLE FONCTION : Gestion du clic sur "Non assigné" - CORRIGÉE
  const handleUnassignedClick = () => {
    console.log(`[UserStatsTableNew] 🖱️ Clic sur demandes NON ASSIGNÉES`);
    // Naviguer vers le dashboard Growth avec un filtre pour les demandes non assignées
    navigate("/growth-dashboard", { 
      state: { 
        showUnassigned: true,
        userName: "Demandes non assignées",
        filterType: 'unassigned'
      } 
    });
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
            Debug & Refresh FINAL CORRIGÉ
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
              {/* Colonne "Non assigné" uniquement pour Growth */}
              {activeTab === "growth" && (
                <TableHead onClick={() => handleSort("unassigned")} className="cursor-pointer">
                  <div className="flex items-center">
                    <UserX className="mr-2 h-4 w-4 text-gray-500" />
                    Non assigné {getSortIcon("unassigned")}
                  </div>
                </TableHead>
              )}
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
                  {/* Cellule "Non assigné" uniquement pour Growth avec gestion du clic CORRIGÉE */}
                  {activeTab === "growth" && (
                    <TableCell 
                      className="font-medium cursor-pointer hover:text-blue-600"
                      onClick={(e) => {
                        e.stopPropagation(); // Empêcher le clic sur la ligne
                        handleUnassignedClick(); // Naviguer vers les demandes non assignées
                      }}
                    >
                      {user.stats.unassigned || 0}
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={activeTab === "growth" ? 6 : 5} className="text-center py-8 text-muted-foreground">
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
