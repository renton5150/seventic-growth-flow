
import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RequestsTable } from "@/components/dashboard/RequestsTable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockData } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Database, User, AlertCircle, CheckCircle, Clock, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const navigate = useNavigate();

  const isSDR = user?.role === "sdr";
  const isGrowth = user?.role === "growth";

  // Filter requests based on user role
  const requests = isSDR
    ? mockData.requests.filter(
        (request) =>
          mockData.missions
            .filter((mission) => mission.sdrId === user?.id)
            .map((mission) => mission.id)
            .includes(request.missionId)
      )
    : mockData.requests;

  // Filter requests based on active tab
  const filteredRequests = requests.filter((request) => {
    if (activeTab === "all") return true;
    if (activeTab === "email") return request.type === "email";
    if (activeTab === "database") return request.type === "database";
    if (activeTab === "linkedin") return request.type === "linkedin";
    if (activeTab === "pending") return request.status === "pending";
    if (activeTab === "late") return request.isLate;
    return false;
  });

  // Count stats for cards
  const totalRequests = requests.length;
  const pendingRequests = requests.filter((r) => r.status === "pending").length;
  const completedRequests = requests.filter((r) => r.status === "completed").length;
  const lateRequests = requests.filter((r) => r.isLate).length;

  // Navigation vers la page de création de demande
  const handleCreateRequest = (type: string) => {
    switch (type) {
      case "email":
        navigate("/requests/email/new");
        break;
      case "database":
        navigate("/requests/database/new");
        break;
      case "linkedin":
        navigate("/requests/linkedin/new");
        break;
      default:
        break;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          {isSDR && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  className="bg-seventic-500 hover:bg-seventic-600"
                >
                  <Plus className="mr-2 h-4 w-4" /> Nouvelle demande
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleCreateRequest("email")}>
                  <Mail className="mr-2 h-4 w-4" /> Campagne Email
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCreateRequest("database")}>
                  <Database className="mr-2 h-4 w-4" /> Base de données
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCreateRequest("linkedin")}>
                  <User className="mr-2 h-4 w-4" /> Scraping LinkedIn
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total des demandes"
            value={totalRequests}
            icon={<Mail size={24} className="text-seventic-500" />}
          />
          <StatCard
            title="En attente"
            value={pendingRequests}
            icon={<Clock size={24} className="text-status-pending" />}
          />
          <StatCard
            title="Terminées"
            value={completedRequests}
            icon={<CheckCircle size={24} className="text-status-completed" />}
          />
          <StatCard
            title="En retard"
            value={lateRequests}
            icon={<AlertCircle size={24} className="text-status-late" />}
          />
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="all">Toutes</TabsTrigger>
              <TabsTrigger value="email">Emailing</TabsTrigger>
              <TabsTrigger value="database">Bases de données</TabsTrigger>
              <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
              <TabsTrigger value="pending">En attente</TabsTrigger>
              <TabsTrigger value="late">En retard</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-4">
            <RequestsTable requests={filteredRequests} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
