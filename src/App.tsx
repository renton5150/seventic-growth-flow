
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/auth";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import EmailCampaignRequest from "./pages/EmailCampaignRequest";
import EmailCampaignEdit from "./pages/EmailCampaignEdit";
import DatabaseCreationRequest from "./pages/DatabaseCreationRequest";
import LinkedInScrapingRequest from "./pages/LinkedInScrapingRequest";
import RequestDetails from "./pages/RequestDetails";
import Calendar from "./pages/Calendar";
import Missions from "./pages/Missions";
import GrowthDashboard from "./pages/GrowthDashboard";
import Databases from "./pages/Databases";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/requests/email/new" 
              element={
                <ProtectedRoute>
                  <EmailCampaignRequest />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/requests/email/:id/edit" 
              element={
                <ProtectedRoute>
                  <EmailCampaignEdit />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/requests/database/new" 
              element={
                <ProtectedRoute>
                  <DatabaseCreationRequest />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/requests/linkedin/new" 
              element={
                <ProtectedRoute>
                  <LinkedInScrapingRequest />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/requests/:type/:id" 
              element={
                <ProtectedRoute>
                  <RequestDetails />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/calendar" 
              element={
                <ProtectedRoute>
                  <Calendar />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/missions" 
              element={
                <ProtectedRoute>
                  <Missions />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/growth" 
              element={
                <ProtectedRoute allowedRoles={["admin", "growth"]}>
                  <GrowthDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/databases" 
              element={
                <ProtectedRoute>
                  <Databases />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminUsers />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
