
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/auth/AuthProviderComponent";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EmailCampaignRequest from "./pages/EmailCampaignRequest";
import LinkedInScrapingRequest from "./pages/LinkedInScrapingRequest";
import DatabaseCreationRequest from "./pages/DatabaseCreationRequest";
import RequestDetails from "./pages/RequestDetails";
import EmailCampaignEdit from "./pages/EmailCampaignEdit";
import LinkedInScrapingEdit from "./pages/LinkedInScrapingEdit";
import DatabaseCreationEdit from "./pages/DatabaseCreationEdit";
import Calendar from "./pages/Calendar";
import Planning from "./pages/Planning";
import Missions from "./pages/Missions";
import AdminUsers from "./pages/AdminUsers";
import AdminMissions from "./pages/AdminMissions";
import AdminDashboard from "./pages/AdminDashboard";
import GrowthDashboard from "./pages/GrowthDashboard";
import Archives from "./pages/Archives";
import Databases from "./pages/Databases";
import AcelleEmailCampaigns from "./pages/AcelleEmailCampaigns";
import AIDashboard from "./pages/AIDashboard";
import EmailPlatforms from "./pages/EmailPlatforms";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import PermissionsDebug from "./pages/PermissionsDebug";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/permissions-debug" element={<PermissionsDebug />} />
              
              {/* Routes protégées */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/requests/email-campaign" element={<ProtectedRoute><EmailCampaignRequest /></ProtectedRoute>} />
              <Route path="/requests/linkedin-scraping" element={<ProtectedRoute><LinkedInScrapingRequest /></ProtectedRoute>} />
              <Route path="/requests/database-creation" element={<ProtectedRoute><DatabaseCreationRequest /></ProtectedRoute>} />
              <Route path="/requests/:type/:id" element={<ProtectedRoute><RequestDetails /></ProtectedRoute>} />
              <Route path="/requests/email/:id/edit" element={<ProtectedRoute><EmailCampaignEdit /></ProtectedRoute>} />
              <Route path="/requests/linkedin/:id/edit" element={<ProtectedRoute><LinkedInScrapingEdit /></ProtectedRoute>} />
              <Route path="/requests/database/:id/edit" element={<ProtectedRoute><DatabaseCreationEdit /></ProtectedRoute>} />
              
              <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
              <Route path="/planning" element={<ProtectedRoute><Planning /></ProtectedRoute>} />
              <Route path="/missions" element={<ProtectedRoute><Missions /></ProtectedRoute>} />
              <Route path="/databases" element={<ProtectedRoute><Databases /></ProtectedRoute>} />
              <Route path="/email-platforms" element={<ProtectedRoute><EmailPlatforms /></ProtectedRoute>} />
              <Route path="/archives" element={<ProtectedRoute><Archives /></ProtectedRoute>} />
              
              {/* Routes administrateur */}
              <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/missions" element={<ProtectedRoute allowedRoles={["admin"]}><AdminMissions /></ProtectedRoute>} />
              <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/growth" element={<ProtectedRoute allowedRoles={["admin", "growth"]}><GrowthDashboard /></ProtectedRoute>} />
              <Route path="/acelle-campaigns" element={<ProtectedRoute allowedRoles={["admin"]}><AcelleEmailCampaigns /></ProtectedRoute>} />
              <Route path="/ai-dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AIDashboard /></ProtectedRoute>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
