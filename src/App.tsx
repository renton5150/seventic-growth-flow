
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AcelleProvider } from './contexts/AcelleContext';
import AcelleEmailCampaigns from './pages/AcelleEmailCampaigns';
import Unauthorized from './pages/Unauthorized';
import Login from './pages/Login';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AcelleProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <AdminRoute>
                      <AcelleEmailCampaigns />
                    </AdminRoute>
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </AcelleProvider>
    </QueryClientProvider>
  );
}

export default App;
