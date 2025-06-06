
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

export const UserStatsTable = () => {
  const [activeTab, setActiveTab] = useState<"sdr" | "growth">("sdr");
  const [sortColumn, setSortColumn] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const { data: requests = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: ['admin-requests-user-stats'],
    queryFn: async () => {
      return await fetchRequests();
    },
    refetchInterval: 5000
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin-users-for-stats'],
    queryFn: getAllUsers,
    refetchInterval: 10000
  });

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getUserStats = (userId: string) => {
    let userRequests;
    
    if (activeTab === "sdr") {
      // Pour les SDR, compter les demandes qu'ils ont créées
      userRequests = requests.filter(r => r.createdBy === userId);
    } else {
      // Pour les Growth, compter les demandes qui leur sont assignées
      userRequests = requests.filter(r => r.assigned_to === userId);
    }
    
    return {
      total: userRequests.length,
      pending: userRequests.filter(r => 
        r.workflow_status === "pending_assignment" || r.status === "pending"
      ).length,
      completed: userRequests.filter(r => r.workflow_status === "completed").length,
      late: userRequests.filter(r => r.isLate && 
        r.workflow_status !== 'completed' && r.workflow_status !== 'canceled'
      ).length,
    };
  };

  const handleUserClick = (user: User) => {
    if (activeTab === "sdr") {
      // Rediriger vers les demandes créées par ce SDR
      navigate("/growth", { state: { createdBy: user.id, userName: user.name } });
    } else {
      // Rediriger vers les demandes assignées à ce Growth
      navigate("/growth", { state: { assignedTo: user.id, userName: user.name } });
    }
  };

  const filteredUsers = useMemo(() => {
    return users
      .filter(user => 
        user.role === activeTab && 
        (
          search === "" || 
          user.name.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase())
        )
      )
      .sort((a, b) => {
        const aValue = sortColumn === "name" ? a.name : getUserStats(a.id)[sortColumn as keyof ReturnType<typeof getUserStats>] || 0;
        const bValue = sortColumn === "name" ? b.name : getUserStats(b.id)[sortColumn as keyof ReturnType<typeof getUserStats>] || 0;
        
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        } else {
          return sortDirection === "asc" ? 
            (aValue as number) - (bValue as number) : 
            (bValue as number) - (aValue as number);
        }
      });
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
              filteredUsers.map((user) => {
                const stats = getUserStats(user.id);
                return (
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
                    <TableCell className="font-medium">{stats.total}</TableCell>
                    <TableCell className="font-medium">{stats.pending}</TableCell>
                    <TableCell className="font-medium">{stats.completed}</TableCell>
                    <TableCell className="font-medium">{stats.late}</TableCell>
                  </TableRow>
                );
              })
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
