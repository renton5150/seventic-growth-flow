import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Planning from "./pages/Planning";
import WorkSchedule from "./pages/WorkSchedule";
import Missions from "./pages/Missions";
import EmailCampaignRequest from "./pages/EmailCampaignRequest";
import EmailCampaignEdit from "./pages/EmailCampaignEdit";
import DatabaseCreationRequest from "./pages/DatabaseCreationRequest";
import DatabaseCreationEdit from "./pages/DatabaseCreationEdit";
import LinkedInScrapingRequest from "./pages/LinkedInScrapingRequest";
import LinkedInScrapingEdit from "./pages/LinkedInScrapingEdit";
import RequestDetails from "./pages/RequestDetails";
import AdminUsers from "./pages/AdminUsers";
import AdminDashboard from "./pages/AdminDashboard";
import AdminMissions from "./pages/AdminMissions";
import GrowthDashboard from "./pages/GrowthDashboard";
import Archives from "./pages/Archives";
import Databases from "./pages/Databases";
import EmailPlatforms from "./pages/EmailPlatforms";
import AcelleEmailCampaigns from "./pages/AcelleEmailCampaigns";
import AIDashboard from "./pages/AIDashboard";
import CRA from "./pages/CRA";
import Calendar from "./pages/Calendar";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/planning" element={<Planning />} />
              <Route path="/work-schedule" element={<WorkSchedule />} />
              <Route path="/missions" element={<Missions />} />
              {/* Routes corrigées pour les nouvelles demandes */}
              <Route path="/requests/email/new" element={<EmailCampaignRequest />} />
              <Route path="/requests/database/new" element={<DatabaseCreationRequest />} />
              <Route path="/requests/linkedin/new" element={<LinkedInScrapingRequest />} />
              {/* Routes pour l'édition existantes */}
              <Route path="/email-campaign" element={<EmailCampaignRequest />} />
              <Route path="/email-campaign/edit/:id" element={<EmailCampaignEdit />} />
              <Route path="/database-creation" element={<DatabaseCreationRequest />} />
              <Route path="/database-creation/edit/:id" element={<DatabaseCreationEdit />} />
              <Route path="/linkedin-scraping" element={<LinkedInScrapingRequest />} />
              <Route path="/linkedin-scraping/edit/:id" element={<LinkedInScrapingEdit />} />
              {/* Routes pour les détails de demande - avec les deux formats possibles */}
              <Route path="/request/:requestId" element={<RequestDetails />} />
              <Route path="/requests/email/:requestId" element={<RequestDetails />} />
              <Route path="/requests/database/:requestId" element={<RequestDetails />} />
              <Route path="/requests/linkedin/:requestId" element={<RequestDetails />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/missions" element={<AdminMissions />} />
              <Route path="/growth" element={<GrowthDashboard />} />
              <Route path="/growth-dashboard" element={<GrowthDashboard />} />
              <Route path="/archives" element={<Archives />} />
              <Route path="/databases" element={<Databases />} />
              <Route path="/email-platforms" element={<EmailPlatforms />} />
              <Route path="/acelle-campaigns" element={<AcelleEmailCampaigns />} />
              <Route path="/ai-dashboard" element={<AIDashboard />} />
              <Route path="/cra" element={<CRA />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
