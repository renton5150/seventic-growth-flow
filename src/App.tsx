import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AuthCallback from './pages/AuthCallback';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import Missions from './pages/Missions';
import Planning from './pages/Planning';
import Calendar from './pages/Calendar';
import Databases from './pages/Databases';
import Archives from './pages/Archives';
import AdminUsers from './pages/AdminUsers';
import AdminDashboard from './pages/AdminDashboard';
import AdminMissions from './pages/AdminMissions';
import EmailPlatforms from './pages/EmailPlatforms';
import AcelleCampaigns from './pages/AcelleCampaigns';
import AIDashboard from './pages/AIDashboard';
import GrowthDashboard from './pages/GrowthDashboard';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import { ErrorBoundary } from './components/ErrorBoundary';
import CRA from "@/pages/CRA";

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/cra" element={<ProtectedRoute><CRA /></ProtectedRoute>} />
              <Route path="/missions" element={<ProtectedRoute><Missions /></ProtectedRoute>} />
              <Route path="/planning" element={<ProtectedRoute><Planning /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
              <Route path="/databases" element={<ProtectedRoute><Databases /></ProtectedRoute>} />
              <Route path="/archives" element={<ProtectedRoute><Archives /></ProtectedRoute>} />
              
              {/* Admin routes */}
              <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/missions" element={<ProtectedRoute><AdminMissions /></ProtectedRoute>} />
              
              <Route path="/email-platforms" element={<ProtectedRoute><EmailPlatforms /></ProtectedRoute>} />
              <Route path="/acelle-campaigns" element={<ProtectedRoute><AcelleCampaigns /></ProtectedRoute>} />
              <Route path="/ai-dashboard" element={<ProtectedRoute><AIDashboard /></ProtectedRoute>} />
              <Route path="/growth-dashboard" element={<ProtectedRoute><GrowthDashboard /></ProtectedRoute>} />
              <Route path="/growth/:defaultTab" element={<ProtectedRoute><GrowthDashboard /></ProtectedRoute>} />
              
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </QueryClientProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
