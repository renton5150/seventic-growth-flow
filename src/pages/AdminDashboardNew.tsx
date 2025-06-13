
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Plus, Eye, Users, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SimpleRequest {
  id: string;
  title: string;
  type: string;
  status: string;
  workflow_status: string;
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  due_date: string;
  mission_id: string | null;
}

interface SimpleUser {
  id: string;
  name: string;
  role: string;
  email: string;
}

const AdminDashboardNew = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<SimpleRequest[]>([]);
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [userProfiles, setUserProfiles] = useState<{[key: string]: string}>({});
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
        console.log("🚀 AdminDashboardNew: Récupération des données");

        // Test 1: Récupérer les demandes directement depuis la table requests
        console.log("📊 Récupération des demandes...");
        const { data: requestsData, error: requestsError } = await supabase
          .from('requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (requestsError) {
          console.error("❌ Erreur demandes:", requestsError);
          throw requestsError;
        }

        console.log("✅ Demandes récupérées:", requestsData?.length || 0);
        setRequests(requestsData || []);

        // Test 2: Récupérer les utilisateurs depuis la table profiles
        console.log("👥 Récupération des utilisateurs...");
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, name, role, email')
          .in('role', ['sdr', 'growth', 'admin']);

        if (usersError) {
          console.error("❌ Erreur utilisateurs:", usersError);
          throw usersError;
        }

        console.log("✅ Utilisateurs récupérés:", usersData?.length || 0);
        setUsers(usersData || []);

        // Créer un mapping des profils utilisateur
        const profilesMap: {[key: string]: string} = {};
        usersData?.forEach(user => {
          profilesMap[user.id] = user.name || user.email || 'Utilisateur inconnu';
        });
        setUserProfiles(profilesMap);

        setFilteredRequests(requestsData || []);

      } catch (error) {
        console.error("❌ Erreur globale:", error);
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

  // Calcul des statistiques
  const totalRequests = filteredRequests.length;
  const pendingRequests = filteredRequests.filter(r => r.workflow_status === 'pending_assignment' || r.status === 'pending').length;
  const inProgressRequests = filteredRequests.filter(r => r.workflow_status === 'in_progress').length;
  const completedRequests = filteredRequests.filter(r => r.workflow_status === 'completed').length;
  const overdueRequests = filteredRequests.filter(r => {
    const dueDate = new Date(r.due_date);
    const now = new Date();
    return dueDate < now && r.workflow_status !== 'completed';
  }).length;

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

  const getTypeBadge = (type: string) => {
    const colors = {
      'email_campaign': 'bg-purple-100 text-purple-800',
      'database_creation': 'bg-orange-100 text-orange-800',
      'linkedin_scraping': 'bg-blue-100 text-blue-800'
    };
    const color = colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    return <Badge variant="outline" className={color}>{type}</Badge>;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8 text-center">
          <p>Chargement du nouveau tableau de bord administrateur...</p>
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
              {selectedUser ? `Dashboard - ${selectedUser.name}` : "Nouveau Dashboard Administrateur"}
            </h1>
            <p className="mt-2 text-gray-500">
              {selectedUser 
                ? `Vue des demandes pour ${selectedUser.name} (${selectedUser.role})`
                : "Gestion simplifiée des demandes - Version reconstruite"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRequests}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingRequests}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En cours</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressRequests}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Terminées</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedRequests}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En retard</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overdueRequests}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tableau des demandes */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Liste des demandes</h3>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Créé par</TableHead>
                <TableHead>Assigné à</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date création</TableHead>
                <TableHead>Date limite</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    {getTypeBadge(request.type)}
                  </TableCell>
                  <TableCell className="font-medium">{request.title}</TableCell>
                  <TableCell>
                    {userProfiles[request.created_by] || 'Inconnu'}
                  </TableCell>
                  <TableCell>
                    {request.assigned_to ? userProfiles[request.assigned_to] || 'Inconnu' : 'Non assigné'}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(request.status, request.workflow_status)}
                  </TableCell>
                  <TableCell>
                    {new Date(request.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    {new Date(request.due_date).toLocaleDateString('fr-FR')}
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

export default AdminDashboardNew;
