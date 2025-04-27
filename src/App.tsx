
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import NotFoundPage from "@/pages/NotFoundPage";
import RequestDetails from "@/pages/RequestDetails";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminRoute from "@/components/auth/AdminRoute";
import UnauthorizedPage from "@/pages/UnauthorizedPage";
import AdminDashboard from "@/pages/AdminDashboard";
import MobileFeedback from "@/components/ui/mobile-feedback";
import DatabaseRequestPage from "@/pages/DatabaseRequestPage";
import LinkedInRequestPage from "@/pages/LinkedInRequestPage";
import DatabaseEditPage from "@/pages/DatabaseEditPage";
import LinkedInScrapingEditPage from "@/pages/LinkedInScrapingEditPage";
import TestPage from "@/pages/TestPage";
import MissionsListPage from "@/pages/MissionsListPage";
import MissionDetailsPage from "@/pages/MissionDetailsPage";
import MissionCreationPage from "@/pages/MissionCreationPage";
import MissionEditPage from "@/pages/MissionEditPage";
import AdminRequestsPage from "@/pages/AdminRequestsPage";
import ProfilePage from "@/pages/ProfilePage";
import TeamPage from "@/pages/TeamPage";
import { I18nProvider } from "@/contexts/I18nContext";

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ui-theme">
      <AuthProvider>
        <I18nProvider>
          <Router>
            <MobileFeedback />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              
              {/* Routes protégées nécessitant une authentification */}
              <Route element={<ProtectedRoute allowedRoles={["admin", "growth", "sdr"]} />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/requests/:id" element={<RequestDetails />} />
                <Route path="/database-request" element={<DatabaseRequestPage />} />
                <Route path="/linkedin-request" element={<LinkedInRequestPage />} />
                <Route path="/edit/database-request/:id" element={<DatabaseEditPage />} />
                <Route path="/edit/linkedin-request/:id" element={<LinkedInScrapingEditPage />} />
                <Route path="/missions" element={<MissionsListPage />} />
                <Route path="/missions/:id" element={<MissionDetailsPage />} />
              </Route>
              
              {/* Routes Admin */}
              <Route element={<AdminRoute />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/team" element={<TeamPage />} />
                <Route path="/admin/requests" element={<AdminRequestsPage />} />
                <Route path="/admin/missions/create" element={<MissionCreationPage />} />
                <Route path="/admin/missions/:id/edit" element={<MissionEditPage />} />
                
                {/* Tests & Développement */}
                <Route path="/test" element={<TestPage />} />
              </Route>
              
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <Toaster position="top-center" closeButton richColors />
          </Router>
        </I18nProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
