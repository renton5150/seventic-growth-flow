
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import EmailCampaignRequest from "./pages/EmailCampaignRequest";
import DatabaseCreationRequest from "./pages/DatabaseCreationRequest";
import LinkedInScrapingRequest from "./pages/LinkedInScrapingRequest";

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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
