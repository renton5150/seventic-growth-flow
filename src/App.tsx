import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/auth";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import Missions from "./pages/Missions";
import EmailCampaignRequest from "./pages/EmailCampaignRequest";
import DatabaseCreationRequest from "./pages/DatabaseCreationRequest";
import LinkedInScrapingRequest from "./pages/LinkedInScrapingRequest";
import RequestDetails from "./pages/RequestDetails";
import EmailCampaignEdit from "./pages/EmailCampaignEdit";
import DatabaseCreationEdit from "./pages/DatabaseCreationEdit";
import LinkedInScrapingEdit from "./pages/LinkedInScrapingEdit";
import AdminUsers from "./pages/AdminUsers";
import AdminMissions from "./pages/AdminMissions";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDashboardNew from "./pages/AdminDashboardNew";
import GrowthDashboard from "./pages/GrowthDashboard";
import Archives from "./pages/Archives";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import Calendar from "./pages/Calendar";
import Planning from "./pages/Planning";
import CRA from "./pages/CRA";
import WorkSchedule from "./pages/WorkSchedule";
import AIDashboard from "./pages/AIDashboard";
import Databases from "./pages/Databases";
import EmailPlatforms from "./pages/EmailPlatforms";
import AcelleEmailCampaigns from "./pages/AcelleEmailCampaigns";

// Components
import { ProtectedRoute } from "./components/layout/ProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <TooltipProvider>
          <AuthProvider>
            <Router>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/auth-callback" element={<AuthCallback />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Protected routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/missions" element={
                  <ProtectedRoute>
                    <Missions />
                  </ProtectedRoute>
                } />
                
                <Route path="/request/email-campaign" element={
                  <ProtectedRoute>
                    <EmailCampaignRequest />
                  </ProtectedRoute>
                } />
                
                <Route path="/request/database-creation" element={
                  <ProtectedRoute>
                    <DatabaseCreationRequest />
                  </ProtectedRoute>
                } />
                
                <Route path="/request/linkedin-scraping" element={
                  <ProtectedRoute>
                    <LinkedInScrapingRequest />
                  </ProtectedRoute>
                } />
                
                {/* Routes pour les détails des demandes - FORMAT UNIFIÉ */}
                <Route path="/request/:requestId" element={
                  <ProtectedRoute>
                    <RequestDetails />
                  </ProtectedRoute>
                } />
                
                {/* Routes pour l'édition des demandes - FORMAT UNIFIÉ */}
                <Route path="/request/:requestId/edit" element={
                  <ProtectedRoute>
                    <EmailCampaignEdit />
                  </ProtectedRoute>
                } />
                
                <Route path="/request/:requestId/edit-database" element={
                  <ProtectedRoute>
                    <DatabaseCreationEdit />
                  </ProtectedRoute>
                } />
                
                <Route path="/request/:requestId/edit-linkedin" element={
                  <ProtectedRoute>
                    <LinkedInScrapingEdit />
                  </ProtectedRoute>
                } />

                {/* Routes ANCIENNES pour compatibilité - REDIRECTION VERS NOUVEAU FORMAT */}
                <Route path="/requests/email/:requestId" element={<Navigate to="/request/:requestId" replace />} />
                <Route path="/requests/database/:requestId" element={<Navigate to="/request/:requestId" replace />} />
                <Route path="/requests/linkedin/:requestId" element={<Navigate to="/request/:requestId" replace />} />
                <Route path="/requests/:type/:requestId" element={<Navigate to="/request/:requestId" replace />} />
                
                <Route path="/requests/email/:requestId/edit" element={<Navigate to="/request/:requestId/edit" replace />} />
                <Route path="/requests/database/:requestId/edit" element={<Navigate to="/request/:requestId/edit-database" replace />} />
                <Route path="/requests/linkedin/:requestId/edit" element={<Navigate to="/request/:requestId/edit-linkedin" replace />} />

                {/* Admin routes */}
                <Route path="/admin/dashboard" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/admin-dashboard-new" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboardNew />
                  </ProtectedRoute>
                } />
                
                <Route path="/admin/users" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminUsers />
                  </ProtectedRoute>
                } />
                
                <Route path="/admin/missions" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminMissions />
                  </ProtectedRoute>
                } />

                {/* Growth routes */}
                <Route path="/growth" element={
                  <ProtectedRoute allowedRoles={['growth', 'admin']}>
                    <GrowthDashboard />
                  </ProtectedRoute>
                } />
                
                {/* Add the missing growth-dashboard route */}
                <Route path="/growth-dashboard" element={
                  <ProtectedRoute allowedRoles={['growth', 'admin']}>
                    <GrowthDashboard />
                  </ProtectedRoute>
                } />
                
                {/* Archives - ACCESSIBLE AUX SDR, GROWTH ET ADMIN */}
                <Route path="/archives" element={
                  <ProtectedRoute allowedRoles={['sdr', 'growth', 'admin']}>
                    <Archives />
                  </ProtectedRoute>
                } />

                {/* Other protected routes */}
                <Route path="/calendar" element={
                  <ProtectedRoute>
                    <Calendar />
                  </ProtectedRoute>
                } />
                
                <Route path="/planning" element={
                  <ProtectedRoute>
                    <Planning />
                  </ProtectedRoute>
                } />
                
                <Route path="/cra" element={
                  <ProtectedRoute>
                    <CRA />
                  </ProtectedRoute>
                } />
                
                <Route path="/work-schedule" element={
                  <ProtectedRoute>
                    <WorkSchedule />
                  </ProtectedRoute>
                } />
                
                <Route path="/ai-dashboard" element={
                  <ProtectedRoute>
                    <AIDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/databases" element={
                  <ProtectedRoute>
                    <Databases />
                  </ProtectedRoute>
                } />
                
                <Route path="/email-platforms" element={
                  <ProtectedRoute>
                    <EmailPlatforms />
                  </ProtectedRoute>
                } />
                
                <Route path="/acelle-campaigns" element={
                  <ProtectedRoute>
                    <AcelleEmailCampaigns />
                  </ProtectedRoute>
                } />

                {/* Catch all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
