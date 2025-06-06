
import { useState, useMemo } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  ArrowUpDown, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Search 
} from "lucide-react";
import { User } from "@/types/types";
import { useQuery } from "@tanstack/react-query";
import { fetchRequests } from "@/services/requests/requestQueryService";
import { getAllUsers } from "@/services/userService";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

export const UserStatsTableFixed = () => {
  const [activeTab, setActiveTab] = useState<"sdr" | "growth">("sdr");
  const [sortColumn, setSortColumn] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const { data: requests = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: ['admin-requests-user-stats-fixed'],
    queryFn: async () => {
      console.log("[UserStatsTableFixed] 🔄 Récupération des demandes pour statistiques utilisateur");
      const allRequests = await fetchRequests();
      console.log(`[UserStatsTableFixed] 📊 Total demandes: ${allRequests.length}`);
      
      // Log détaillé pour debug
      console.log("🔍 ANALYSE DÉTAILLÉE DES DEMANDES 🔍");
      allRequests.forEach((req, index) => {
        console.log(`Demande ${index + 1}:`, {
          id: req.id.slice(0, 8),
          title: req.title,
          status: req.status,
          workflow_status: req.workflow_status,
          created_by: req.createdBy?.slice(0, 8) || 'null',
          assigned_to: req.assigned_to?.slice(0, 8) || 'null',
          due_date: req.dueDate,
          is_late: req.isLate
        });
      });
      
      return allRequests;
    },
    refetchInterval: 5000
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin-users-for-stats-fixed'],
    queryFn: async () => {
      console.log("[UserStatsTableFixed] 👥 Récupération des utilisateurs");
      const allUsers = await getAllUsers();
      console.log(`[UserStatsTableFixed] 👤 Total utilisateurs: ${allUsers.length}`);
      
      // Log des utilisateurs
      allUsers.forEach(user => {
        console.log(`User: ${user.name} (${user.role}) - ID: ${user.id.slice(0, 8)}`);
      });
      
      return allUsers;
    },
    refetchInterval: 10000
  });

  // CORRECTION: Fonction de calcul des statistiques complètement refactorisée
  const calculateUserStatistics = (userId: string, userRole: string) => {
    console.log(`\n📊 CALCUL STATS pour ${userRole} ${userId.slice(0, 8)}`);
    
    let userRequests;
    
    // Filtrage selon le rôle de l'utilisateur
    if (userRole === "sdr") {
      // Pour les SDR, compter les demandes qu'ils ont créées
      userRequests = requests.filter(r => r.createdBy === userId);
      console.log(`SDR: ${userRequests.length} demandes créées par ${userId.slice(0, 8)}`);
    } else if (userRole === "growth") {
      // Pour les Growth, compter les demandes qui leur sont assignées
      userRequests = requests.filter(r => r.assigned_to === userId);
      console.log(`Growth: ${userRequests.length} demandes assignées à ${userId.slice(0, 8)}`);
    } else {
      // Pour les autres (admin), compter toutes les demandes assignées
      userRequests = requests.filter(r => r.assigned_to === userId);
      console.log(`Admin: ${userRequests.length} demandes assignées à ${userId.slice(0, 8)}`);
    }
    
    const now = new Date();
    
    // Calcul détaillé avec logs
    const pendingRequests = userRequests.filter(r => {
      const isPending = r.workflow_status === "pending_assignment" || r.status === "pending";
      if (isPending) {
        console.log(`  📋 Pending: ${r.title} (workflow: ${r.workflow_status}, status: ${r.status})`);
      }
      return isPending;
    });
    
    const completedRequests = userRequests.filter(r => {
      const isCompleted = r.workflow_status === "completed";
      if (isCompleted) {
        console.log(`  ✅ Completed: ${r.title} (workflow: ${r.workflow_status})`);
      }
      return isCompleted;
    });
    
    const lateRequests = userRequests.filter(r => {
      const isActive = r.workflow_status !== 'completed' && r.workflow_status !== 'canceled';
      const isLate = r.isLate || (r.dueDate && new Date(r.dueDate) < now);
      const isActuallyLate = isActive && isLate;
      
      if (isActuallyLate) {
        console.log(`  ⚠️ Late: ${r.title} (due: ${r.dueDate}, workflow: ${r.workflow_status})`);
      }
      return isActuallyLate;
    });
    
    const stats = {
      total: userRequests.length,
      pending: pendingRequests.length,
      completed: completedRequests.length,
      late: lateRequests.length,
    };

    console.log(`📊 Stats finales pour ${userId.slice(0, 8)}:`, stats);
    return stats;
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleUserClick = (user: User) => {
    console.log(`[UserStatsTableFixed] 🖱️ Clic sur utilisateur ${activeTab}: ${user.name}`);
    
    if (activeTab === "sdr") {
      navigate("/growth", { state: { createdBy: user.id, userName: user.name } });
    } else {
      navigate("/growth", { state: { assignedTo: user.id, userName: user.name } });
    }
  };

  const filteredUsers = useMemo(() => {
    console.log(`\n🔍 FILTRAGE UTILISATEURS (${activeTab})`);
    
    const filtered = users
      .filter(user => {
        const matchesRole = user.role === activeTab;
        const matchesSearch = search === "" || 
          user.name.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase());
        return matchesRole && matchesSearch;
      })
      .map(user => ({
        ...user,
        stats: calculateUserStatistics(user.id, user.role)
      }))
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

    console.log(`Utilisateurs filtrés (${activeTab}):`, filtered.length);
    return filtered;
  }, [users, activeTab, search, sortColumn, sortDirection, requests]);

  const getSortIcon = (column: string) => {
    if (sortColumn === column) {
      return sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />;
    }
    return <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />;
  };

  if (isLoadingRequests || isLoadingUsers) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "sdr" | "growth")}>
          <TabsList>
            <TabsTrigger value="sdr">SDR</TabsTrigger>
            <TabsTrigger value="growth">Growth</TabsTrigger>
          </TabsList>
        </Tabs>

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
    </div>
  );
};
