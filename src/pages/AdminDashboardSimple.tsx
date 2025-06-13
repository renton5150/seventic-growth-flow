
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Plus, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SimpleRequest {
  id: string;
  title: string;
  type: string;
  status: string;
  workflow_status: string;
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  created_by_profile?: { name: string } | null;
  assigned_to_profile?: { name: string } | null;
}

interface SimpleUser {
  id: string;
  name: string;
  role: string;
}

const AdminDashboardSimple = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<SimpleRequest[]>([]);
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [filteredRequests, setFilteredRequests] = useState<SimpleRequest[]>([]);

  // Redirection si pas admin
  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Récupération des données
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("🚀 AdminDashboardSimple: Récupération des données");

        // Récupérer les utilisateurs
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, name, role')
          .in('role', ['sdr', 'growth']);

        if (usersError) {
          console.error("Erreur utilisateurs:", usersError);
          return;
        }

        // Récupérer les demandes avec les profils
        const { data: requestsData, error: requestsError } = await supabase
          .from('requests')
          .select(`
            id,
            title,
            type,
            status,
            workflow_status,
            created_by,
            assigned_to,
            created_at,
            created_by_profile:profiles!requests_created_by_fkey(name),
            assigned_to_profile:profiles!requests_assigned_to_fkey(name)
          `)
          .order('created_at', { ascending: false });

        if (requestsError) {
          console.error("Erreur demandes:", requestsError);
          return;
        }

        console.log("✅ Données récupérées:", {
          users: usersData?.length || 0,
          requests: requestsData?.length || 0
        });

        setUsers(usersData || []);
        setRequests(requestsData || []);
        setFilteredRequests(requestsData || []);
      } catch (error) {
        console.error("Erreur globale:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtrage par utilisateur
  useEffect(() => {
    if (!selectedUserId) {
      setFilteredRequests(requests);
      return;
    }

    const filtered = requests.filter(request => 
      request.created_by === selectedUserId || request.assigned_to === selectedUserId
    );
    
    console.log(`🔍 Filtrage par utilisateur ${selectedUserId}:`, filtered.length, "demandes");
    setFilteredRequests(filtered);
  }, [selectedUserId, requests]);

  const handleCreateRequest = () => {
    navigate("/requests/email/new");
  };

  const handleViewRequest = (requestId: string) => {
    navigate(`/request/${requestId}`);
  };

  const getStatusBadge = (status: string, workflowStatus: string) => {
    if (workflowStatus === 'completed') {
      return <Badge variant="outline" className="bg-green-100 text-green-800">Terminée</Badge>;
    }
    if (workflowStatus === 'in_progress') {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800">En cours</Badge>;
    }
    return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">En attente</Badge>;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8 text-center">
          <p>Chargement du tableau de bord administrateur...</p>
        </div>
      </AppLayout>
    );
  }

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              {selectedUser ? `Dashboard - ${selectedUser.name}` : "Dashboard Administrateur Simple"}
            </h1>
            <p className="mt-2 text-gray-500">
              {selectedUser 
                ? `Vue des demandes pour ${selectedUser.name} (${selectedUser.role})`
                : "Gestion simplifiée des demandes"
              }
            </p>
          </div>
          
          <Button onClick={handleCreateRequest} className="bg-seventic-500 hover:bg-seventic-600">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle demande
          </Button>
        </div>

        {/* Sélecteur d'utilisateurs */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Filtrer par utilisateur</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={!selectedUserId ? "default" : "outline"}
              onClick={() => setSelectedUserId(null)}
            >
              Tous ({requests.length})
            </Button>
            {users.map(user => {
              const userRequestCount = requests.filter(r => 
                r.created_by === user.id || r.assigned_to === user.id
              ).length;
              
              return (
                <Button
                  key={user.id}
                  variant={selectedUserId === user.id ? "default" : "outline"}
                  onClick={() => setSelectedUserId(user.id)}
                >
                  {user.name} ({userRequestCount})
                </Button>
              );
            })}
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-500">Total</h3>
            <p className="text-2xl font-bold">{filteredRequests.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-500">En attente</h3>
            <p className="text-2xl font-bold">
              {filteredRequests.filter(r => r.workflow_status === 'pending_assignment').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-500">En cours</h3>
            <p className="text-2xl font-bold">
              {filteredRequests.filter(r => r.workflow_status === 'in_progress').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-500">Terminées</h3>
            <p className="text-2xl font-bold">
              {filteredRequests.filter(r => r.workflow_status === 'completed').length}
            </p>
          </div>
        </div>

        {/* Tableau des demandes */}
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Créé par</TableHead>
                <TableHead>Assigné à</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date création</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <Badge variant="outline">{request.type}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{request.title}</TableCell>
                  <TableCell>
                    {request.created_by_profile?.name || 'Inconnu'}
                  </TableCell>
                  <TableCell>
                    {request.assigned_to_profile?.name || 'Non assigné'}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(request.status, request.workflow_status)}
                  </TableCell>
                  <TableCell>
                    {new Date(request.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewRequest(request.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredRequests.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              {selectedUser 
                ? `Aucune demande trouvée pour ${selectedUser.name}`
                : "Aucune demande trouvée"
              }
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminDashboardSimple;
